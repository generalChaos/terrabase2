'use client';

import React from 'react';
import { ShoppingCart, Mail, X } from 'lucide-react';
import { TShirtOrderItem } from './TShirtModal';

interface OrderSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  orderItems: TShirtOrderItem[];
  onRemoveItem: (itemId: string) => void;
  onSendEmail: () => void;
}

export default function OrderSummary({
  isOpen,
  onClose,
  orderItems,
  onRemoveItem,
  onSendEmail
}: OrderSummaryProps) {
  if (!isOpen) return null;

  const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  const generateEmailContent = () => {
    let emailBody = `Team Merchandise Order\n\n`;
    emailBody += `Team: ${orderItems[0]?.teamName || 'N/A'}\n\n`;
    emailBody += `Order Details:\n`;
    emailBody += `================\n\n`;

    orderItems.forEach((item, index) => {
      emailBody += `${index + 1}. ${item.type.toUpperCase()}\n`;
      emailBody += `   Size: ${item.size}\n`;
      emailBody += `   Color: ${item.color}\n`;
      emailBody += `   Back: ${item.backOption.replace('_', ' ').toUpperCase()}\n`;
      if (item.selectedPlayer) {
        emailBody += `   Player: ${item.selectedPlayer.firstName} ${item.selectedPlayer.lastName}`;
        if (item.selectedPlayer.number) {
          emailBody += ` #${item.selectedPlayer.number}`;
        }
        emailBody += `\n`;
      }
      emailBody += `   Description: ${item.description}\n`;
      emailBody += `   Quantity: ${item.quantity}\n\n`;
    });

    emailBody += `Total Items: ${totalItems}\n\n`;
    emailBody += `Please contact us to discuss pricing and delivery options.\n\n`;
    emailBody += `Thank you for your order!`;

    return emailBody;
  };

  const handleSendEmail = () => {
    const subject = `Team Merchandise Order - ${orderItems[0]?.teamName || 'Team'}`;
    const body = generateEmailContent();
    const emailUrl = `mailto:velasco.rico@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.open(emailUrl, '_blank');
    onSendEmail();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <ShoppingCart size={24} className="text-blue-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Order Summary</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {orderItems.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Your order is empty</p>
              <p className="text-gray-400">Add some items to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Order Items */}
              {orderItems.map((item, index) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 capitalize">
                          {item.type} #{index + 1}
                        </h3>
                        <span className="text-sm font-medium text-blue-600">
                          Qty: {item.quantity}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Size:</span> {item.size}
                        </div>
                        <div>
                          <span className="font-medium">Color:</span> {item.color}
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium">Back:</span> {item.backOption.replace('_', ' ').toUpperCase()}
                        </div>
                        {item.selectedPlayer && (
                          <div className="col-span-2">
                            <span className="font-medium">Player:</span> {item.selectedPlayer.firstName} {item.selectedPlayer.lastName}
                            {item.selectedPlayer.number && ` #${item.selectedPlayer.number}`}
                          </div>
                        )}
                        <div className="col-span-2">
                          <span className="font-medium">Description:</span> {item.description}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-red-500 hover:text-red-700 transition-colors ml-4 p-1"
                      title="Remove item"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Order Summary */}
              <div className="border-t pt-4 mt-6">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Items:</span>
                  <span>{totalItems}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-6">
                <button
                  onClick={handleSendEmail}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Mail size={20} className="mr-2" />
                  Send Order Email
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
