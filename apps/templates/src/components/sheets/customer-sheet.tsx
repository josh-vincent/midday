"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@midday/ui/sheet";
import { Button } from "@midday/ui/button";
import { Badge } from "@midday/ui/badge";
import { Separator } from "@midday/ui/separator";
import { format } from "date-fns";
import { 
  Edit, 
  Trash, 
  FileText,
  Mail,
  Phone,
  Globe,
  MapPin,
  Building,
  User,
  Crown,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  TrendingUp,
  TrendingDown,
  Archive,
  Share,
  MoreHorizontal,
  CreditCard,
  MessageSquare,
  Activity
} from "lucide-react";
import { cn } from "@midday/ui/cn";
import type { MockCustomer, MockCustomerActivity } from "@/lib/mock/customers-mock";

type Props = {
  customer: MockCustomer | null;
  activity?: MockCustomerActivity[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (customer: MockCustomer) => void;
  onDelete?: (customer: MockCustomer) => void;
  onCreateInvoice?: (customer: MockCustomer) => void;
  onSendEmail?: (customer: MockCustomer) => void;
  onCall?: (customer: MockCustomer) => void;
  onArchive?: (customer: MockCustomer) => void;
};

export function CustomerSheet({ 
  customer, 
  activity = [],
  open, 
  onOpenChange,
  onEdit,
  onDelete,
  onCreateInvoice,
  onSendEmail,
  onCall,
  onArchive,
}: Props) {
  if (!customer) return null;

  const statusConfig = {
    active: { label: "Active", variant: "default" as const, icon: CheckCircle, color: "text-green-500" },
    inactive: { label: "Inactive", variant: "secondary" as const, icon: Clock, color: "text-gray-500" },
    suspended: { label: "Suspended", variant: "destructive" as const, icon: AlertTriangle, color: "text-red-500" },
    prospect: { label: "Prospect", variant: "outline" as const, icon: Eye, color: "text-blue-500" },
  };

  const typeConfig = {
    individual: { label: "Individual", icon: User, color: "text-blue-500" },
    business: { label: "Business", icon: Building, color: "text-purple-500" },
    enterprise: { label: "Enterprise", icon: Crown, color: "text-yellow-500" },
  };

  const status = statusConfig[customer.status];
  const type = typeConfig[customer.type];
  const StatusIcon = status.icon;
  const TypeIcon = type.icon;

  const revenueGrowth = customer.totalRevenue > 10000 ? 12.5 : -5.2; // Mock calculation
  const paymentScore = customer.averagePaymentTime <= 30 ? "Excellent" : 
                      customer.averagePaymentTime <= 45 ? "Good" : "Poor";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[700px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              customer.type === "enterprise" ? "bg-yellow-100" :
              customer.type === "business" ? "bg-purple-100" : "bg-blue-100"
            )}>
              <TypeIcon className={cn("h-5 w-5", type.color)} />
            </div>
            <div>
              <span>{customer.name}</span>
              <div className="text-sm text-muted-foreground font-normal">
                {customer.email}
              </div>
            </div>
          </SheetTitle>
          <SheetDescription>
            View and manage customer details, revenue, and activity
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status and Key Metrics */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant={status.variant} className="flex items-center space-x-1">
                  <StatusIcon className="h-3 w-3" />
                  <span>{status.label}</span>
                </Badge>
                <Badge variant="outline" className="flex items-center space-x-1">
                  <TypeIcon className="h-3 w-3" />
                  <span>{type.label}</span>
                </Badge>
              </div>
            </div>

            {/* Revenue Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-700">
                      ${customer.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
                <div className="flex items-center space-x-1 mt-2">
                  <span className={cn(
                    "text-xs",
                    revenueGrowth > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {revenueGrowth > 0 ? "+" : ""}{revenueGrowth}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs last period</span>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 font-medium">Outstanding</p>
                    <p className="text-2xl font-bold text-orange-700">
                      ${customer.outstandingBalance.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-orange-500" />
                </div>
                <div className="mt-2">
                  <span className="text-xs text-orange-600">
                    {customer.overdueInvoices} overdue invoices
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="font-medium">Contact Information</h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{customer.email}</p>
                  <p className="text-xs text-muted-foreground">Primary email</p>
                </div>
              </div>

              {customer.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{customer.phone}</p>
                    <p className="text-xs text-muted-foreground">Primary phone</p>
                  </div>
                </div>
              )}

              {customer.website && (
                <div className="flex items-center space-x-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{customer.website}</p>
                    <p className="text-xs text-muted-foreground">Website</p>
                  </div>
                </div>
              )}

              {customer.address && (
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">
                      {customer.address.street}
                    </p>
                    <p className="text-sm">
                      {customer.address.city}, {customer.address.state} {customer.address.zip}
                    </p>
                    <p className="text-xs text-muted-foreground">{customer.address.country}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact Person */}
          {customer.contactPerson && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium">Primary Contact</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{customer.contactPerson.name}</p>
                      {customer.contactPerson.title && (
                        <p className="text-xs text-muted-foreground">{customer.contactPerson.title}</p>
                      )}
                    </div>
                  </div>
                  {customer.contactPerson.email && (
                    <div className="flex items-center space-x-3 mt-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">{customer.contactPerson.email}</span>
                    </div>
                  )}
                  {customer.contactPerson.phone && (
                    <div className="flex items-center space-x-3 mt-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">{customer.contactPerson.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Invoice Summary */}
          <div className="space-y-4">
            <h4 className="font-medium">Invoice Summary</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{customer.totalInvoices}</p>
                <p className="text-xs text-muted-foreground">Total Invoices</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{customer.paidInvoices}</p>
                <p className="text-xs text-muted-foreground">Paid</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{customer.overdueInvoices}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Avg. Payment Time</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium">{customer.averagePaymentTime} days</span>
                <Badge 
                  variant={paymentScore === "Excellent" ? "default" : paymentScore === "Good" ? "secondary" : "destructive"} 
                  className="ml-2 text-xs"
                >
                  {paymentScore}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Payment Terms</span>
              </div>
              <span className="text-sm">{customer.paymentTerms.replace('_', ' ').toUpperCase()}</span>
            </div>

            {customer.preferredPaymentMethod && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Preferred Method</span>
                </div>
                <span className="text-sm capitalize">
                  {customer.preferredPaymentMethod.replace('_', ' ')}
                </span>
              </div>
            )}
          </div>

          {/* Tags */}
          {customer.tags && customer.tags.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {customer.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {customer.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Notes</p>
                </div>
                <p className="text-sm text-muted-foreground ml-6">
                  {customer.notes}
                </p>
              </div>
            </>
          )}

          {/* Recent Activity */}
          {activity.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium">Recent Activity</h4>
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {activity.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-start space-x-3 text-sm">
                      <Activity className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p>{item.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(item.date), "MMM dd, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      {item.amount && (
                        <span className="text-sm font-medium">
                          ${item.amount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Key Dates */}
          <Separator />
          <div className="space-y-3">
            <h4 className="font-medium">Key Dates</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer since:</span>
                <span>{format(new Date(customer.createdAt), "MMM dd, yyyy")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last updated:</span>
                <span>{format(new Date(customer.updatedAt), "MMM dd, yyyy")}</span>
              </div>
              {customer.lastActivityAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last activity:</span>
                  <span>{format(new Date(customer.lastActivityAt), "MMM dd, yyyy")}</span>
                </div>
              )}
              {customer.lastPaymentAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last payment:</span>
                  <span>{format(new Date(customer.lastPaymentAt), "MMM dd, yyyy")}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex justify-between">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onEdit?.(customer);
                  onOpenChange(false);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              
              {customer.status === "active" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onCreateInvoice?.(customer);
                    onOpenChange(false);
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              )}

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onSendEmail?.(customer)}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>

              {customer.phone && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onCall?.(customer)}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
              )}

              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
            
            <div className="flex space-x-2">
              {customer.status !== "inactive" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onArchive?.(customer);
                    onOpenChange(false);
                  }}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
              )}
              
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onDelete?.(customer);
                  onOpenChange(false);
                }}
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}