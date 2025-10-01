"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Separator } from "@midday/ui/separator";
import { 
  ChevronLeft,
  Edit,
  Plus,
  X,
  Users,
  Building,
  Mail,
  Phone,
  CheckCircle,
  Trash2,
  Eye,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@midday/ui/cn";

// Mock customer data
interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: "active" | "inactive";
  created: string;
}

const initialCustomers: Customer[] = [
  {
    id: 1,
    name: "John Doe",
    email: "john@acme.com",
    phone: "+1 (555) 123-4567",
    company: "Acme Corp",
    status: "active",
    created: "2024-01-15"
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@techstart.io",
    phone: "+1 (555) 987-6543",
    company: "Tech Startup Inc",
    status: "active",
    created: "2024-02-20"
  },
  {
    id: 3,
    name: "Bob Johnson",
    email: "bob@local.biz",
    phone: "+1 (555) 456-7890",
    company: "Local Business",
    status: "inactive",
    created: "2024-03-10"
  }
];

// Mock Sheet Component for CRUD operations
const CrudSheet = ({ 
  open, 
  onOpenChange, 
  title, 
  children,
  onSubmit
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  title: string; 
  children: React.ReactNode;
  onSubmit: () => void;
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Sheet */}
      <div className="relative bg-background shadow-lg w-96 ml-auto p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-6">
          {children}
          
          <div className="flex gap-2 pt-4 border-t">
            <Button type="submit" className="flex-1">
              Save Changes
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function CrudComponentsShowcase() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showBulkEditSheet, setShowBulkEditSheet] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [notifications, setNotifications] = useState<Array<{ id: number; message: string }>>([]);

  // Form states
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    status: "active" as "active" | "inactive"
  });

  const addNotification = (message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const handleCreate = () => {
    if (!newCustomer.name || !newCustomer.email) {
      addNotification("Please fill in required fields");
      return;
    }

    const customer: Customer = {
      id: Math.max(...customers.map(c => c.id)) + 1,
      ...newCustomer,
      created: new Date().toISOString().split('T')[0]
    };

    setCustomers(prev => [...prev, customer]);
    setNewCustomer({ name: "", email: "", phone: "", company: "", status: "active" });
    setShowCreateSheet(false);
    addNotification("Customer created successfully");
  };

  const handleEdit = () => {
    if (!editingCustomer) return;

    setCustomers(prev => prev.map(c => 
      c.id === editingCustomer.id ? editingCustomer : c
    ));
    setShowEditSheet(false);
    setEditingCustomer(null);
    addNotification("Customer updated successfully");
  };

  const handleBulkEdit = () => {
    const status = "active"; // In real app, this would come from form
    setCustomers(prev => prev.map(c => 
      selectedCustomers.includes(c.id) ? { ...c, status } : c
    ));
    setSelectedCustomers([]);
    setShowBulkEditSheet(false);
    addNotification(`Updated ${selectedCustomers.length} customers`);
  };

  const handleDelete = (id: number) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    addNotification("Customer deleted successfully");
  };

  const toggleSelection = (id: number) => {
    setSelectedCustomers(prev => 
      prev.includes(id) 
        ? prev.filter(cid => cid !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedCustomers(
      selectedCustomers.length === customers.length 
        ? [] 
        : customers.map(c => c.id)
    );
  };

  return (
    <>
      <div className="space-y-8">
        {/* Back Navigation */}
        <div>
          <Link href="/packages">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Packages
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-xl bg-orange-500 flex items-center justify-center text-white">
              <Edit className="h-10 w-10" />
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">@midday/crud-components</h1>
                  <Badge className="text-white bg-green-500" variant="secondary">
                    stable
                  </Badge>
                  <Badge variant="outline">v1.0.0</Badge>
                </div>
                <p className="text-lg text-muted-foreground">
                  Complete CRUD operation components with create, edit, and bulk edit sheets. Streamlined data management with validation and state handling.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button asChild>
                  <a href="https://github.com/midday-ai/crud-components" target="_blank" rel="noopener noreferrer">
                    View Source
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://docs.midday.ai/packages/crud-components" target="_blank" rel="noopener noreferrer">
                    Documentation
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Interactive Demo */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Interactive Demo</h2>
              <p className="text-muted-foreground">
                Complete customer management system demonstrating all CRUD operations.
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowCreateSheet(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Customer
              </Button>
              
              {selectedCustomers.length > 0 && (
                <Button 
                  variant="outline"
                  onClick={() => setShowBulkEditSheet(true)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Bulk Edit ({selectedCustomers.length})
                </Button>
              )}
            </div>
          </div>

          {/* Customer Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Customers ({customers.length})
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedCustomers.length === customers.length && customers.length > 0}
                    onChange={selectAll}
                    className="rounded"
                  />
                  <span className="text-sm text-muted-foreground">Select All</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {customers.map(customer => (
                  <div key={customer.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.includes(customer.id)}
                      onChange={() => toggleSelection(customer.id)}
                      className="rounded"
                    />
                    
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                      {customer.name.charAt(0)}
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <h3 className="font-medium">{customer.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {customer.company}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </p>
                      </div>
                      
                      <div>
                        <Badge 
                          variant={customer.status === "active" ? "default" : "secondary"}
                          className="mb-1"
                        >
                          {customer.status}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          Created: {customer.created}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setEditingCustomer(customer);
                            setShowEditSheet(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(customer.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {customers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No customers found.</p>
                    <p className="text-sm">Create your first customer to get started.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Installation */}
        <Card>
          <CardHeader>
            <CardTitle>Installation</CardTitle>
            <CardDescription>
              Get started with @midday/crud-components
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">npm</h4>
              <code className="block p-3 bg-muted rounded-md text-sm font-mono">
                npm install @midday/crud-components
              </code>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Usage</h4>
              <pre className="p-4 bg-muted rounded-md text-sm overflow-x-auto">
                <code>{`import { CreateSheet, EditSheet, BulkEditSheet } from "@midday/crud-components";

// Create Sheet
<CreateSheet
  open={showCreate}
  onOpenChange={setShowCreate}
  title="Create Customer"
  schema={customerSchema}
  onSubmit={handleCreate}
  fields={[
    { name: 'name', label: 'Name', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' }
  ]}
/>

// Edit Sheet
<EditSheet
  open={showEdit}
  onOpenChange={setShowEdit}
  title="Edit Customer"
  defaultValues={selectedCustomer}
  onSubmit={handleUpdate}
/>

// Bulk Edit Sheet
<BulkEditSheet
  open={showBulkEdit}
  selectedItems={selectedItems}
  onSubmit={handleBulkUpdate}
/>`}</code>
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Sheet */}
      <CrudSheet
        open={showCreateSheet}
        onOpenChange={setShowCreateSheet}
        title="Create New Customer"
        onSubmit={handleCreate}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="create-name">Name *</Label>
            <Input
              id="create-name"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter customer name"
            />
          </div>
          
          <div>
            <Label htmlFor="create-email">Email *</Label>
            <Input
              id="create-email"
              type="email"
              value={newCustomer.email}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
            />
          </div>
          
          <div>
            <Label htmlFor="create-phone">Phone</Label>
            <Input
              id="create-phone"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Enter phone number"
            />
          </div>
          
          <div>
            <Label htmlFor="create-company">Company</Label>
            <Input
              id="create-company"
              value={newCustomer.company}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, company: e.target.value }))}
              placeholder="Enter company name"
            />
          </div>
          
          <div>
            <Label htmlFor="create-status">Status</Label>
            <select
              id="create-status"
              value={newCustomer.status}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, status: e.target.value as "active" | "inactive" }))}
              className="w-full p-2 border rounded-md"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </CrudSheet>

      {/* Edit Sheet */}
      {editingCustomer && (
        <CrudSheet
          open={showEditSheet}
          onOpenChange={setShowEditSheet}
          title="Edit Customer"
          onSubmit={handleEdit}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editingCustomer.name}
                onChange={(e) => setEditingCustomer(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="Enter customer name"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editingCustomer.email}
                onChange={(e) => setEditingCustomer(prev => prev ? { ...prev, email: e.target.value } : null)}
                placeholder="Enter email address"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={editingCustomer.phone}
                onChange={(e) => setEditingCustomer(prev => prev ? { ...prev, phone: e.target.value } : null)}
                placeholder="Enter phone number"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-company">Company</Label>
              <Input
                id="edit-company"
                value={editingCustomer.company}
                onChange={(e) => setEditingCustomer(prev => prev ? { ...prev, company: e.target.value } : null)}
                placeholder="Enter company name"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <select
                id="edit-status"
                value={editingCustomer.status}
                onChange={(e) => setEditingCustomer(prev => prev ? { ...prev, status: e.target.value as "active" | "inactive" } : null)}
                className="w-full p-2 border rounded-md"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CrudSheet>
      )}

      {/* Bulk Edit Sheet */}
      <CrudSheet
        open={showBulkEditSheet}
        onOpenChange={setShowBulkEditSheet}
        title={`Bulk Edit ${selectedCustomers.length} Customers`}
        onSubmit={handleBulkEdit}
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              You are editing {selectedCustomers.length} customers. Changes will be applied to all selected items.
            </p>
          </div>
          
          <div>
            <Label htmlFor="bulk-status">Status</Label>
            <select
              id="bulk-status"
              className="w-full p-2 border rounded-md"
              defaultValue="active"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">
              Additional bulk edit fields would appear here in a real implementation.
            </p>
          </div>
        </div>
      </CrudSheet>

      {/* Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="p-3 rounded-md shadow-lg border bg-green-50 border-green-200 text-green-800 flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            {notification.message}
          </div>
        ))}
      </div>
    </>
  );
}