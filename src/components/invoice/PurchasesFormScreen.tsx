import React from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { PurchaseForm } from '@/components/invoice/PurchaseForm'; // Adjust path if necessary
import { View, StyleSheet } from 'react-native';

// Define the interface for the purchase object passed as a parameter
interface Purchase {
  id: string;
  po_number: string;
  vendor_id: string;
  vendor_name: string;
  order_date: string;
  delivery_date: string | null;
  total_amount: number;
  status: 'Draft' | 'Ordered' | 'Received' | 'Paid';
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  line_items?: any[]; // Keep as any for simplicity in this context, or define fully
}

export default function PurchaseFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parse the purchase object from route params if it exists
  const purchaseParam = params.purchase ? JSON.parse(params.purchase as string) : null;
  const purchase: Purchase | null = purchaseParam;

  // Handler for when the form submission is successful
  const handleSubmitSuccess = () => {
    // Navigate back to the previous screen (e.g., PurchaseList)
    router.back();
    // Or navigate to a specific screen: router.push('/invoice/purchases');
  };

  // Handler for closing the form without saving
  const handleClose = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: purchase ? 'Edit Purchase Order' : 'Create New Purchase Order',
          headerBackTitleVisible: false, // Hide back button text on iOS
          headerShown: true, // Ensure header is shown
          headerLargeTitle: false, // Optional: make title smaller
        }}
      />
      <PurchaseForm
        purchase={purchase}
        onClose={handleClose}
        onSubmitSuccess={handleSubmitSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2', // Match background of other screens
    padding: 16, // Add some padding around the form
  },
});