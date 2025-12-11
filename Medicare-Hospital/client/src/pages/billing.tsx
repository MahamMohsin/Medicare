import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Calendar,
  Check,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileText,
  Plus,
  Printer,
  Receipt,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Bill, Patient } from "@shared/schema";

const paymentFormSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  paymentMethod: z.enum(["cash", "card", "insurance", "upi"]),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  paid: "secondary",
  partial: "outline",
  pending: "default",
  cancelled: "destructive",
};

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash", icon: DollarSign },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "insurance", label: "Insurance", icon: FileText },
  { value: "upi", label: "UPI", icon: Receipt },
];

export default function Billing() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: bills, isLoading } = useQuery<(Bill & { patient?: Patient })[]>({
    queryKey: ["/api/bills", { status: statusFilter !== "all" ? statusFilter : undefined }],
  });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients/list"],
  });

  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: "",
      paymentMethod: "cash",
    },
  });

  const [newBillItems, setNewBillItems] = useState<{ description: string; quantity: number; rate: number }[]>([
    { description: "", quantity: 1, rate: 0 },
  ]);
  const [newBillPatient, setNewBillPatient] = useState("");

  const createBillMutation = useMutation({
    mutationFn: async (data: { patientId: string; items: any[] }) => {
      return apiRequest("POST", "/api/bills", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Bill created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/bills"] });
      setIsCreateDialogOpen(false);
      setNewBillItems([{ description: "", quantity: 1, rate: 0 }]);
      setNewBillPatient("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create bill", variant: "destructive" });
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData & { billId: string }) => {
      return apiRequest("POST", `/api/bills/${data.billId}/payment`, {
        amount: parseFloat(data.amount),
        paymentMethod: data.paymentMethod,
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Payment recorded successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/bills"] });
      setIsPaymentDialogOpen(false);
      setSelectedBill(null);
      paymentForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to record payment", variant: "destructive" });
    },
  });

  const handleRecordPayment = (bill: any) => {
    setSelectedBill(bill);
    const remaining = parseFloat(bill.total) - parseFloat(bill.paidAmount || "0");
    paymentForm.setValue("amount", remaining.toFixed(2));
    setIsPaymentDialogOpen(true);
  };

  const onSubmitPayment = (data: PaymentFormData) => {
    recordPaymentMutation.mutate({ ...data, billId: selectedBill.id });
  };

  const handleCreateBill = () => {
    const items = newBillItems.filter((i) => i.description && i.rate > 0).map((i) => ({
      ...i,
      amount: i.quantity * i.rate,
    }));
    if (items.length === 0 || !newBillPatient) {
      toast({ title: "Error", description: "Please add at least one item and select a patient", variant: "destructive" });
      return;
    }
    createBillMutation.mutate({ patientId: newBillPatient, items });
  };

  const addBillItem = () => {
    setNewBillItems([...newBillItems, { description: "", quantity: 1, rate: 0 }]);
  };

  const updateBillItem = (index: number, field: string, value: any) => {
    const updated = [...newBillItems];
    (updated[index] as any)[field] = value;
    setNewBillItems(updated);
  };

  const removeBillItem = (index: number) => {
    setNewBillItems(newBillItems.filter((_, i) => i !== index));
  };

  const newBillSubtotal = newBillItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);

  const filteredBills = (bills || []).filter((bill) => {
    const matchesSearch =
      bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.patient?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.patient?.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || bill.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = (bills || []).reduce((sum, b) => sum + parseFloat(b.paidAmount || "0"), 0);
  const pendingAmount = (bills || []).reduce((sum, b) => {
    if (b.paymentStatus !== "paid") {
      return sum + (parseFloat(b.total) - parseFloat(b.paidAmount || "0"));
    }
    return sum;
  }, 0);
  const paidCount = (bills || []).filter((b) => b.paymentStatus === "paid").length;
  const pendingCount = (bills || []).filter((b) => b.paymentStatus === "pending").length;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Billing"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Billing" }]}
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Billing & Payments</h2>
              <p className="text-muted-foreground">Manage invoices and track payments</p>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-bill">
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <CardDescription>Total Revenue</CardDescription>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">${totalRevenue.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <CardDescription>Pending Amount</CardDescription>
                <Receipt className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-yellow-600">${pendingAmount.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <CardDescription>Paid Invoices</CardDescription>
                <Check className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{paidCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <CardDescription>Pending Invoices</CardDescription>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{pendingCount}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search bills..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-search-bills"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredBills.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBills.map((bill) => (
                        <TableRow key={bill.id} data-testid={`row-bill-${bill.id}`}>
                          <TableCell>
                            <span className="font-mono text-sm">{bill.billNumber}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {bill.patient?.firstName?.[0]}{bill.patient?.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span>
                                {bill.patient?.firstName} {bill.patient?.lastName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {bill.createdAt ? new Date(bill.createdAt).toLocaleDateString() : "-"}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${parseFloat(bill.total).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            ${parseFloat(bill.paidAmount || "0").toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusColors[bill.paymentStatus || "pending"]} className="capitalize">
                              {bill.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => setSelectedBill(bill)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {bill.paymentStatus !== "paid" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRecordPayment(bill)}
                                >
                                  <DollarSign className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon">
                                <Printer className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Receipt className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-medium">No bills found</h3>
                  <p className="text-sm text-muted-foreground">Create your first invoice to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>Generate a new bill for a patient</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Patient *</label>
              <Select value={newBillPatient} onValueChange={setNewBillPatient}>
                <SelectTrigger data-testid="select-patient">
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients?.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName} ({patient.patientId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Line Items</label>
                <Button variant="outline" size="sm" onClick={addBillItem}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-2">
                {newBillItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center">
                    <Input
                      className="col-span-5"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateBillItem(index, "description", e.target.value)}
                    />
                    <Input
                      className="col-span-2"
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateBillItem(index, "quantity", parseInt(e.target.value) || 1)}
                    />
                    <Input
                      className="col-span-3"
                      type="number"
                      placeholder="Rate"
                      value={item.rate || ""}
                      onChange={(e) => updateBillItem(index, "rate", parseFloat(e.target.value) || 0)}
                    />
                    <div className="col-span-1 text-right text-sm font-medium">
                      ${(item.quantity * item.rate).toFixed(2)}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="col-span-1"
                      onClick={() => removeBillItem(index)}
                      disabled={newBillItems.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>${newBillSubtotal.toFixed(2)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateBill}
              disabled={createBillMutation.isPending}
              data-testid="button-submit-bill"
            >
              {createBillMutation.isPending ? "Creating..." : "Create Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Invoice: {selectedBill?.billNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedBill && (
            <div className="mb-4 rounded-lg border p-3">
              <div className="flex justify-between text-sm">
                <span>Total Amount</span>
                <span className="font-medium">${parseFloat(selectedBill.total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Paid</span>
                <span className="font-medium">${parseFloat(selectedBill.paidAmount || "0").toFixed(2)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Remaining</span>
                <span>
                  ${(parseFloat(selectedBill.total) - parseFloat(selectedBill.paidAmount || "0")).toFixed(2)}
                </span>
              </div>
            </div>
          )}
          <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit(onSubmitPayment)} className="space-y-4">
              <FormField
                control={paymentForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} data-testid="input-payment-amount" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={paymentForm.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <div className="grid grid-cols-4 gap-2">
                      {PAYMENT_METHODS.map((method) => (
                        <Button
                          key={method.value}
                          type="button"
                          variant={field.value === method.value ? "default" : "outline"}
                          className="flex-col h-auto py-3"
                          onClick={() => field.onChange(method.value)}
                        >
                          <method.icon className="h-4 w-4 mb-1" />
                          <span className="text-xs">{method.label}</span>
                        </Button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={recordPaymentMutation.isPending}>
                  {recordPaymentMutation.isPending ? "Recording..." : "Record Payment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedBill && !isPaymentDialogOpen} onOpenChange={() => setSelectedBill(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Number</p>
                  <p className="font-mono text-lg font-semibold">{selectedBill.billNumber}</p>
                </div>
                <Badge variant={statusColors[selectedBill.paymentStatus || "pending"]} className="capitalize">
                  {selectedBill.paymentStatus}
                </Badge>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Patient</p>
                <p className="font-semibold">
                  {selectedBill.patient?.firstName} {selectedBill.patient?.lastName}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Items</p>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedBill.items?.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">${item.rate}</TableCell>
                          <TableCell className="text-right">${item.amount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${parseFloat(selectedBill.subtotal).toFixed(2)}</span>
                </div>
                {selectedBill.discount && parseFloat(selectedBill.discount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-${parseFloat(selectedBill.discount).toFixed(2)}</span>
                  </div>
                )}
                {selectedBill.tax && parseFloat(selectedBill.tax) > 0 && (
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${parseFloat(selectedBill.tax).toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${parseFloat(selectedBill.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Paid</span>
                  <span>${parseFloat(selectedBill.paidAmount || "0").toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Balance Due</span>
                  <span>
                    ${(parseFloat(selectedBill.total) - parseFloat(selectedBill.paidAmount || "0")).toFixed(2)}
                  </span>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedBill(null)}>
                  Close
                </Button>
                {selectedBill.paymentStatus !== "paid" && (
                  <Button onClick={() => handleRecordPayment(selectedBill)}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Record Payment
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
