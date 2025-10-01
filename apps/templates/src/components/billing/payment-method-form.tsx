"use client";

import { useState } from "react";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@midday/ui/select";
import { Checkbox } from "@midday/ui/checkbox";
import { useToast } from "@midday/ui/use-toast";
import { CreditCard, Lock, AlertCircle } from "lucide-react";

interface PaymentMethodFormProps {
  onSave?: (paymentMethod: any) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export function PaymentMethodForm({ onSave, onCancel, loading = false }: PaymentMethodFormProps) {
  const [formData, setFormData] = useState({
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvc: "",
    cardholderName: "",
    billingAddress: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "US",
    },
    setAsDefault: true,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Get card type from number
  const getCardType = (number: string) => {
    const sanitized = number.replace(/\s/g, '');
    if (sanitized.startsWith('4')) return 'visa';
    if (sanitized.startsWith('5') || sanitized.startsWith('2')) return 'mastercard';
    if (sanitized.startsWith('3')) return 'amex';
    if (sanitized.startsWith('6')) return 'discover';
    return 'unknown';
  };

  // Generate year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 20 }, (_, i) => currentYear + i);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length < 13) {
      newErrors.cardNumber = 'Please enter a valid card number';
    }

    if (!formData.expiryMonth) {
      newErrors.expiryMonth = 'Please select expiry month';
    }

    if (!formData.expiryYear) {
      newErrors.expiryYear = 'Please select expiry year';
    }

    if (!formData.cvc || formData.cvc.length < 3) {
      newErrors.cvc = 'Please enter a valid CVC';
    }

    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = 'Please enter cardholder name';
    }

    if (!formData.billingAddress.line1.trim()) {
      newErrors['billingAddress.line1'] = 'Please enter billing address';
    }

    if (!formData.billingAddress.city.trim()) {
      newErrors['billingAddress.city'] = 'Please enter city';
    }

    if (!formData.billingAddress.state.trim()) {
      newErrors['billingAddress.state'] = 'Please enter state';
    }

    if (!formData.billingAddress.postalCode.trim()) {
      newErrors['billingAddress.postalCode'] = 'Please enter postal code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors and try again.",
        variant: "destructive",
      });
      return;
    }

    if (!onSave) return;

    setSaving(true);
    try {
      const sanitizedCardNumber = formData.cardNumber.replace(/\s/g, '');
      
      await onSave({
        type: 'card',
        last4: sanitizedCardNumber.slice(-4),
        brand: getCardType(sanitizedCardNumber),
        expiryMonth: parseInt(formData.expiryMonth),
        expiryYear: parseInt(formData.expiryYear),
        cardholderName: formData.cardholderName,
        billingAddress: formData.billingAddress,
        setAsDefault: formData.setAsDefault,
      });

      toast({
        title: "Payment method added",
        description: "Your payment method has been successfully added.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add payment method. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setFormData(prev => ({ ...prev, cardNumber: formatted }));
    if (errors.cardNumber) {
      setErrors(prev => ({ ...prev, cardNumber: '' }));
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const cardType = getCardType(formData.cardNumber);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Add Payment Method
        </CardTitle>
        <CardDescription>
          Add a credit or debit card to your account for billing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card Information */}
          <div className="space-y-4">
            <h3 className="font-medium">Card Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <div className="relative">
                <Input
                  id="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="1234 1234 1234 1234"
                  maxLength={19}
                  className={errors.cardNumber ? 'border-red-500' : ''}
                />
                {cardType !== 'unknown' && (
                  <div className="absolute right-3 top-3">
                    <div className={`text-xs px-2 py-1 rounded ${
                      cardType === 'visa' ? 'bg-blue-100 text-blue-700' :
                      cardType === 'mastercard' ? 'bg-red-100 text-red-700' :
                      cardType === 'amex' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {cardType.toUpperCase()}
                    </div>
                  </div>
                )}
              </div>
              {errors.cardNumber && (
                <p className="text-sm text-red-500">{errors.cardNumber}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryMonth">Month</Label>
                <Select 
                  value={formData.expiryMonth} 
                  onValueChange={(value) => handleInputChange('expiryMonth', value)}
                >
                  <SelectTrigger className={errors.expiryMonth ? 'border-red-500' : ''}>
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <SelectItem key={month} value={month.toString().padStart(2, '0')}>
                        {month.toString().padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.expiryMonth && (
                  <p className="text-sm text-red-500">{errors.expiryMonth}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryYear">Year</Label>
                <Select 
                  value={formData.expiryYear} 
                  onValueChange={(value) => handleInputChange('expiryYear', value)}
                >
                  <SelectTrigger className={errors.expiryYear ? 'border-red-500' : ''}>
                    <SelectValue placeholder="YYYY" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.expiryYear && (
                  <p className="text-sm text-red-500">{errors.expiryYear}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input
                  id="cvc"
                  value={formData.cvc}
                  onChange={(e) => handleInputChange('cvc', e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="123"
                  maxLength={4}
                  className={errors.cvc ? 'border-red-500' : ''}
                />
                {errors.cvc && (
                  <p className="text-sm text-red-500">{errors.cvc}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardholderName">Cardholder Name</Label>
              <Input
                id="cardholderName"
                value={formData.cardholderName}
                onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                placeholder="Full name on card"
                className={errors.cardholderName ? 'border-red-500' : ''}
              />
              {errors.cardholderName && (
                <p className="text-sm text-red-500">{errors.cardholderName}</p>
              )}
            </div>
          </div>

          {/* Billing Address */}
          <div className="space-y-4">
            <h3 className="font-medium">Billing Address</h3>
            
            <div className="space-y-2">
              <Label htmlFor="line1">Address Line 1</Label>
              <Input
                id="line1"
                value={formData.billingAddress.line1}
                onChange={(e) => handleInputChange('billingAddress.line1', e.target.value)}
                placeholder="123 Main Street"
                className={errors['billingAddress.line1'] ? 'border-red-500' : ''}
              />
              {errors['billingAddress.line1'] && (
                <p className="text-sm text-red-500">{errors['billingAddress.line1']}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="line2">Address Line 2 (Optional)</Label>
              <Input
                id="line2"
                value={formData.billingAddress.line2}
                onChange={(e) => handleInputChange('billingAddress.line2', e.target.value)}
                placeholder="Apartment, suite, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.billingAddress.city}
                  onChange={(e) => handleInputChange('billingAddress.city', e.target.value)}
                  placeholder="San Francisco"
                  className={errors['billingAddress.city'] ? 'border-red-500' : ''}
                />
                {errors['billingAddress.city'] && (
                  <p className="text-sm text-red-500">{errors['billingAddress.city']}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.billingAddress.state}
                  onChange={(e) => handleInputChange('billingAddress.state', e.target.value)}
                  placeholder="CA"
                  className={errors['billingAddress.state'] ? 'border-red-500' : ''}
                />
                {errors['billingAddress.state'] && (
                  <p className="text-sm text-red-500">{errors['billingAddress.state']}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={formData.billingAddress.postalCode}
                  onChange={(e) => handleInputChange('billingAddress.postalCode', e.target.value)}
                  placeholder="94105"
                  className={errors['billingAddress.postalCode'] ? 'border-red-500' : ''}
                />
                {errors['billingAddress.postalCode'] && (
                  <p className="text-sm text-red-500">{errors['billingAddress.postalCode']}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select 
                  value={formData.billingAddress.country} 
                  onValueChange={(value) => handleInputChange('billingAddress.country', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="GB">United Kingdom</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                    <SelectItem value="DE">Germany</SelectItem>
                    <SelectItem value="FR">France</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="setAsDefault"
                checked={formData.setAsDefault}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, setAsDefault: checked as boolean }))}
              />
              <Label htmlFor="setAsDefault" className="text-sm">
                Set as default payment method
              </Label>
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-3">
              <Lock className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Your payment information is secure</p>
                <p>We use industry-standard encryption to protect your card details. Your card information is never stored on our servers.</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={saving || loading}
              className="flex-1"
            >
              {saving ? "Adding..." : "Add Payment Method"}
            </Button>
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={saving || loading}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}