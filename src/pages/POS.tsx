import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Card,
  Col,
  Input,
  Modal,
  Row,
  Table,
  Typography,
  Select,
  Tag,
  Divider,
  Grid,
  Form,
  InputNumber,
  message,
  Spin, // Import Spin for loading indicator
} from 'antd';
import {
  PlusOutlined,
  UserAddOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { useAuth } from '../AuthPage'; // Import useAuth

const useBreakpoint = Grid.useBreakpoint;
const { Title, Text } = Typography;
const { Option } = Select;

// --- START: MODIFIED TYPES TO MATCH BACKEND API ---
// Interface matching the public.products_services table structure (from previous context)
interface ProductDB {
  id: number;
  name: string;
  description: string | null;
  unit_price: number; // Renamed from sellingPrice
  cost_price: number | null;
  sku: string | null;
  is_service: boolean;
  stock_quantity: number; // Renamed from qty
  created_at: Date;
  updated_at: Date;
  tax_rate_id: number | null;
  category: string | null;
  unit: string | null;
  tax_rate_value?: number;
}

// Interface for Customer (from previous context, mapped to frontend camelCase)
interface CustomerFrontend {
  id: string; // Changed to string as it comes from DB (PostgreSQL IDs can be large numbers, safer as string)
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  taxId: string | null; // Changed from vatNumber to taxId to match mapCustomerToFrontend
  totalInvoiced: number; // Already camelCase
  // Note: creditScore from dummy data is not in CustomerDB, will need to be managed
  // if it's a frontend-only concept or added to DB. For now, it's removed.
}

// Type for cart items, based on ProductDB, but allowing custom items
type CartItem = (ProductDB | {
  id: string; // For custom items, use a unique string ID
  name: string;
  description: string;
  unit_price: number;
  is_service: boolean; // Custom items can be services
  tax_rate_value: number; // Custom items need a tax rate
}) & { quantity: number; subtotal: number };

type PaymentType = 'Cash' | 'Bank' | 'Credit';
// --- END: MODIFIED TYPES TO MATCH BACKEND API ---

const API_BASE_URL = 'http://localhost:3000'; // IMPORTANT: Replace with your actual backend API URL

// Define fixed VAT rate options (same as QuotationForm)
const VAT_OPTIONS = [
  { value: 0.00, label: '0%' },
  { value: 0.15, label: '15%' },
];

export default function POSScreen() {
  const [messageApi, contextHolder] = message.useMessage();
  const screens = useBreakpoint();

  const [customers, setCustomers] = useState<CustomerFrontend[]>([]); // Now fetched from API
  const [products, setProducts] = useState<ProductDB[]>([]); // Now fetched from API

  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerFrontend | null>(null);
  const [customerModal, setCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [newCustomerForm] = Form.useForm();
  const [showNewCustomer, setShowNewCustomer] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<ProductDB | null>(null);
  const [productModal, setProductModal] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productQty, setProductQty] = useState(1);

  // --- New state for custom product ---
  const [showCustomProductForm, setShowCustomProductForm] = useState(false);
  const [customProductName, setCustomProductName] = useState('');
  const [customProductUnitPrice, setCustomProductUnitPrice] = useState<number>(0);
  const [customProductDescription, setCustomProductDescription] = useState('');
  const [customProductTaxRate, setCustomProductTaxRate] = useState<number>(0.15); // Default to 15% VAT

  const [cart, setCart] = useState<CartItem[]>([]);

  const [paymentType, setPaymentType] = useState<PaymentType>('Cash');
  const [amountPaid, setAmountPaid] = useState(0);
  const [dueDate, setDueDate] = useState<string | null>(null);

  const { isAuthenticated } = useAuth(); // Get authentication status
  const token = localStorage.getItem('token'); // Retrieve the token

  // --- Declare isLoading state ---
  const [isLoading, setIsLoading] = useState(false);

  // Helper to get authorization headers
  const getAuthHeaders = useCallback(() => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }, [token]);

  // --- START: FETCH DATA FROM API ON COMPONENT MOUNT ---
  useEffect(() => {
    async function fetchCustomers() {
      if (!isAuthenticated || !token) {
        messageApi.warning('Please log in to load customers.');
        setCustomers([]);
        return;
      }
      setIsLoading(true); // Set loading true before fetch
      try {
        const response = await fetch(`${API_BASE_URL}/api/customers`, {
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: CustomerFrontend[] = await response.json();
        setCustomers(data);
      } catch (error) {
        console.error('Error fetching customers:', error);
        messageApi.error('Failed to fetch customers.');
      } finally {
        setIsLoading(false); // Set loading false after fetch
      }
    }

    async function fetchProducts() {
      if (!isAuthenticated || !token) {
        messageApi.warning('Please log in to load products.');
        setProducts([]);
        return;
      }
      setIsLoading(true); // Set loading true before fetch
      try {
        const response = await fetch(`${API_BASE_URL}/products-services`, {
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: ProductDB[] = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
        messageApi.error('Failed to fetch products.');
      } finally {
        setIsLoading(false); // Set loading false after fetch
      }
    }

    if (isAuthenticated && token) {
      fetchCustomers();
      fetchProducts();
    } else {
      setCustomers([]);
      setProducts([]);
    }
  }, [isAuthenticated, token, getAuthHeaders, messageApi]); // Add isAuthenticated, token, getAuthHeaders, messageApi to dependencies
  // --- END: FETCH DATA FROM API ON COMPONENT MOUNT ---

  // Add to cart logic
  const addToCart = () => {
    if (!isAuthenticated) {
      messageApi.error('Authentication required to add items to cart.');
      return;
    }

    let itemToAdd: CartItem | null = null;

    if (showCustomProductForm) {
      // Handle custom product
      if (!customProductName.trim() || customProductUnitPrice <= 0 || productQty <= 0) {
        messageApi.error('Please enter a valid name, positive price, and positive quantity for the custom item.');
        return;
      }
      itemToAdd = {
        id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Unique ID for custom item
        name: customProductName.trim(),
        description: customProductDescription.trim() || 'Custom item',
        unit_price: customProductUnitPrice,
        is_service: false, // Assume custom items are products unless specified
        tax_rate_value: customProductTaxRate,
        quantity: productQty,
        subtotal: productQty * customProductUnitPrice * (1 + customProductTaxRate),
      };
    } else {
      // Handle existing product
      if (!selectedProduct || productQty < 1) return;

      const availableQty = selectedProduct.stock_quantity ?? 0;
      const alreadyInCart = cart.find(i => i.id === selectedProduct.id)?.quantity ?? 0;
      if (productQty + alreadyInCart > availableQty) {
        messageApi.error(
          `Not enough stock for "${selectedProduct.name}". Only ${
            availableQty - alreadyInCart
          } units available.`,
        );
        return;
      }
      itemToAdd = {
        ...selectedProduct,
        quantity: productQty,
        subtotal: productQty * selectedProduct.unit_price * (1 + (selectedProduct.tax_rate_value ?? 0)), // Include tax for existing products
      };
    }

    if (!itemToAdd) return; // Should not happen if validation passes

    const existing = cart.find(i => i.id === itemToAdd!.id);
    if (existing) {
      setCart(
        cart.map(i =>
          i.id === itemToAdd!.id
            ? {
                ...i,
                quantity: i.quantity + itemToAdd!.quantity,
                subtotal: (i.quantity + itemToAdd!.quantity) * i.unit_price * (1 + (i.tax_rate_value ?? 0)),
              }
            : i,
        ),
      );
    } else {
      setCart([...cart, itemToAdd]);
    }

    // Reset product selection/custom product form
    setSelectedProduct(null);
    setProductQty(1);
    setProductModal(false);
    setShowCustomProductForm(false);
    setCustomProductName('');
    setCustomProductUnitPrice(0);
    setCustomProductDescription('');
    setCustomProductTaxRate(0.15);
  };

  // Remove from cart
  const removeFromCart = (id: number | string) => setCart(cart.filter(i => i.id !== id)); // ID type changed to number | string

  // --- START: MODIFIED handleAddCustomer TO USE API ---
  const handleAddCustomer = async (values: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    taxId?: string;
  }) => {
    if (!isAuthenticated || !token) {
      messageApi.error('Authentication required to add new customers.');
      return;
    }
    setIsLoading(true); // Set loading true
    try {
      // Check for existing customer by phone before adding (optional, but good practice)
      const existingCustomerResponse = await fetch(
        `${API_BASE_URL}/api/customers?search=${values.phone}`, {
          headers: getAuthHeaders(),
        }
      );
      const existingCustomers: CustomerFrontend[] =
        await existingCustomerResponse.json();
      const existing = existingCustomers.find(
        c => c.phone?.replace(/\D/g, '') === values.phone.replace(/\D/g, ''),
      );

      if (existing) {
        setSelectedCustomer(existing);
        messageApi.info(
          'Customer with that phone number already exists. Selected existing record.',
        );
      } else {
        const response = await fetch(`${API_BASE_URL}/api/customers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            name: values.name,
            phone: values.phone,
            email: values.email || null, // Ensure null for optional fields if empty
            address: values.address || null,
            vatNumber: values.taxId || null, // Map taxId from form to vatNumber for API
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.detail || errorData.error || 'Failed to add new customer.',
          );
        }

        const newCustomer: CustomerFrontend = await response.json();
        setCustomers(prev => [...prev, newCustomer]); // Add new customer to state
        setSelectedCustomer(newCustomer);
        messageApi.success('New customer added and selected.');
      }
    } catch (error: any) {
      console.error('Error adding customer:', error);
      messageApi.error(error.message || 'Failed to add new customer.');
    } finally {
      setIsLoading(false); // Set loading false
      setCustomerModal(false);
      setShowNewCustomer(false);
      newCustomerForm.resetFields();
    }
  };
  // --- END: MODIFIED handleAddCustomer TO USE API ---

  // Cart total
  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const change = paymentType === 'Cash' ? amountPaid - total : 0;

  // --- START: MODIFIED SALE SUBMISSION TO USE API ---
  const handleSubmit = async () => {
    if (!isAuthenticated || !token) {
      messageApi.error('Authentication required to submit sales.');
      return;
    }
    if (cart.length === 0) {
      messageApi.warning('Add at least one product to the cart');
      return;
    }
    if (paymentType === 'Credit' && !selectedCustomer) {
      messageApi.error('Customer not selected for credit sale.');
      return;
    }
    // Optional: Add more robust credit check logic if needed (e.g., from customer's data fetched from backend)
    // For now, if a customer is selected for credit, proceed.

    setIsLoading(true); // Set loading true
    try {
      const salePayload = {
cart: cart.map(item => {
  const isRealProduct = typeof item.id === 'number';

  return {
    ...(isRealProduct ? { id: item.id } : {}), // ✅ only include ID if it's a number
    name: item.name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    subtotal: item.subtotal,
    is_service: item.is_service || false,
    tax_rate_value: item.tax_rate_value ?? 0,
  };
}),

        paymentType,
        total,
        customer: selectedCustomer
          ? { id: selectedCustomer.id, name: selectedCustomer.name }
          : null,
        amountPaid: paymentType === 'Cash' ? amountPaid : 0,
        change: paymentType === 'Cash' ? change : 0,
        dueDate: paymentType === 'Credit' ? dueDate : null,
        // These would come from authenticated user data or configuration
        tellerName: 'Dummy Teller', // Replace with actual user's name if authenticated
        branch: 'Dummy Branch', // Replace with actual branch if applicable
        companyName: 'DummyCo', // Replace with actual company name
      };

      const response = await fetch(`${API_BASE_URL}/api/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(salePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit sale.');
      }

      const result = await response.json();
      console.log('Sale submitted successfully:', result);

      // --- OPTIONAL: Re-fetch products to update stock quantities displayed ---
      // This ensures the displayed stock reflects the latest from the database
      // after a sale, especially if multiple POS stations are operating.
      try {
        const productsResponse = await fetch(`${API_BASE_URL}/products-services`, {
          headers: getAuthHeaders(),
        });
        if (productsResponse.ok) {
          const updatedProductsFromAPI: ProductDB[] =
            await productsResponse.json();
          setProducts(updatedProductsFromAPI);
        } else {
          console.warn(
            'Failed to re-fetch products after sale, stock display might be outdated.',
          );
        }
      } catch (fetchError) {
        console.warn('Error re-fetching products:', fetchError);
      }

      // Clear cart and reset payment details
      setCart([]);
      setAmountPaid(0);
      setDueDate(null);
      setSelectedCustomer(null);
      setPaymentType('Cash');
      messageApi.success('Sale submitted and recorded successfully!');
    } catch (err: any) {
      console.error('Error during sale submission:', err);
      messageApi.error(err.message || 'Could not save sale.');
    } finally {
      setIsLoading(false); // Set loading false
    }
  };
  // --- END: MODIFIED SALE SUBMISSION TO USE API ---

  return (
    <>
      {contextHolder}
      <div style={{ padding: 18, maxWidth: 650, margin: '0 auto' }}>
        <Title level={3}>Point of Sale</Title>

        {/* Customer Select */}
        <Card
          style={{ marginBottom: 12, cursor: 'pointer' }}
          onClick={() => setCustomerModal(true)}
          bodyStyle={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <Text strong>
              {selectedCustomer
                ? selectedCustomer.name
                : 'Select Customer (Optional)'}
            </Text>
            <div style={{ fontSize: 12, color: '#888' }}>
              {selectedCustomer?.phone}
            </div>
          </div>
          <UserAddOutlined />
        </Card>

        {/* Product Select */}
        <Card
          style={{ marginBottom: 12, cursor: 'pointer' }}
          onClick={() => {
            setSelectedProduct(null); // Clear selected product when opening modal
            setShowCustomProductForm(false); // Hide custom form initially
            setProductModal(true);
          }}
          bodyStyle={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <Text strong>
              {selectedProduct ? selectedProduct.name : 'Select Product'}
            </Text>
            <div style={{ fontSize: 12, color: '#888' }}>
              {selectedProduct ? `Price: R${selectedProduct.unit_price.toFixed(2)}` : ''}{' '}
              {/* Use unit_price */}
            </div>
            {selectedProduct && (
              <div style={{ fontSize: 12, color: '#888' }}>
                Stock: {selectedProduct.stock_quantity ?? 0}{' '}
                {selectedProduct.unit || ''} {/* Use stock_quantity */}
              </div>
            )}
          </div>
          <ShoppingCartOutlined />
        </Card>

        {/* Quantity & Add to Cart (now always visible but disabled if no product or custom form not active) */}
        <Row gutter={6} align='middle' style={{ marginBottom: 10 }}>
          <Col>
            <Button
              size='small'
              onClick={() => setProductQty(q => Math.max(1, q - 1))}
              disabled={!isAuthenticated || isLoading || (!selectedProduct && !showCustomProductForm)}
            >
              -
            </Button>
          </Col>
          <Col>
            <InputNumber
              min={1}
              value={productQty}
              onChange={value => setProductQty(value ?? 1)}
              style={{ width: 60 }}
              disabled={!isAuthenticated || isLoading || (!selectedProduct && !showCustomProductForm)}
            />
          </Col>
          <Col>
            <Button
              size='small'
              onClick={() => {
                const max = selectedProduct?.stock_quantity ?? Infinity; // Use stock_quantity
                setProductQty(q => Math.min(q + 1, max));
              }}
              disabled={!isAuthenticated || isLoading || (!selectedProduct && !showCustomProductForm)}
            >
              +
            </Button>
          </Col>
          <Col>
            <Button
              type='primary'
              onClick={addToCart}
              disabled={!isAuthenticated || isLoading || (!selectedProduct && !showCustomProductForm) || (showCustomProductForm && (!customProductName.trim() || customProductUnitPrice <= 0))}
            >
              Add to Cart
            </Button>
          </Col>
        </Row>


        {/* Cart */}
        <Card title='Cart' style={{ marginBottom: 14 }}>
          {isLoading && <Spin tip="Loading products and customers..." style={{ display: 'block', margin: '20px auto' }} />}
          {!isLoading && screens.md ? (
            <Table
              dataSource={cart}
              rowKey='id'
              pagination={false}
              columns={[
                { title: 'Product', dataIndex: 'name' },
                { title: 'Qty', dataIndex: 'quantity' },
                { title: 'Unit Price', dataIndex: 'unit_price', render: (price) => `R${price.toFixed(2)}` },
                {
                  title: 'Total',
                  render: (_, r) =>
                    `R${r.subtotal.toFixed(2)}`,
                },
                {
                  title: 'Action',
                  render: (_, r) => (
                    <Button
                      danger
                      size='small'
                      onClick={() => removeFromCart(r.id)}
                      disabled={!isAuthenticated} // Disable if not authenticated
                    >
                      Remove
                    </Button>
                  ),
                },
              ]}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell colSpan={3}>Total</Table.Summary.Cell>
                  <Table.Summary.Cell>R{total.toFixed(2)}</Table.Summary.Cell>
                  <Table.Summary.Cell />
                </Table.Summary.Row>
              )}
            />
          ) : !isLoading && cart.length === 0 ? (
            <Text type='secondary'>Cart is empty</Text>
          ) : !isLoading && (
            cart.map(item => (
              <Card key={item.id} size='small' style={{ marginBottom: 6 }}>
                <Row justify='space-between' align='middle'>
                  <Col>
                    <Text strong>{item.name}</Text>{' '}
                    <Tag>
                      {item.quantity} x R{item.unit_price.toFixed(2)}{' '}
                    </Tag>
                    <div>Total: R{item.subtotal.toFixed(2)}</div>
                  </Col>
                  <Col>
                    <Button
                      size='small'
                      danger
                      onClick={() => removeFromCart(item.id)}
                      disabled={!isAuthenticated} // Disable if not authenticated
                    >
                      Remove
                    </Button>
                  </Col>
                </Row>
              </Card>
            ))
          )}
        </Card>

        {/* Payment and Submit */}
        <Card>
          <Row gutter={12} align='middle'>
            <Col flex='1 1 auto'>
              <Text strong>Payment Method</Text>
              <Select
                value={paymentType}
                onChange={setPaymentType}
                style={{ width: '100%' }}
                disabled={!isAuthenticated || isLoading} // Disable if not authenticated or loading
              >
                <Option value='Cash'>Cash</Option>
                <Option value='Bank'>Bank</Option>
                <Option value='Credit'>Credit</Option>
              </Select>
            </Col>
            {paymentType === 'Cash' && (
              <Col flex='1 1 auto'>
                <Text>Amount Paid</Text>
                <InputNumber
                  min={0}
                  value={amountPaid}
                  onChange={value => setAmountPaid(value ?? 0)}
                  style={{ width: '100%' }}
                  disabled={!isAuthenticated || isLoading} // Disable if not authenticated or loading
                />
                <div>
                  <Text strong>
                    Change:&nbsp;
                    <span style={{ color: change < 0 ? 'red' : 'green' }}>
                      {change < 0 ? 'Insufficient' : `R${change.toFixed(2)}`}
                    </span>
                  </Text>
                </div>
              </Col>
            )}
            {paymentType === 'Credit' && (
              <Col flex='1 1 auto'>
                <Text>Due Date</Text>
                <Input
                  type='date'
                  value={dueDate || ''}
                  onChange={e => setDueDate(e.target.value)}
                  style={{ width: '100%' }}
                  disabled={!isAuthenticated || isLoading} // Disable if not authenticated or loading
                />
                {selectedCustomer && (
                  <Text type='warning' style={{ color: 'orange' }}>
                    Credit payment selected. Ensure customer credit policy is
                    met.
                  </Text>
                )}
              </Col>
            )}
          </Row>
          <Divider />
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <Text strong>Total: R{total.toFixed(2)}</Text>
          </div>
          <Button
            type='primary'
            block
            onClick={handleSubmit}
            disabled={
              !isAuthenticated || // Disable if not authenticated
              isLoading || // Disable if loading
              cart.length === 0 ||
              (paymentType === 'Cash' && amountPaid < total) ||
              (paymentType === 'Credit' && !selectedCustomer)
            }
          >
            Submit Sale
          </Button>
        </Card>

        {/* ----------- Modals ----------- */}
        <Modal
          open={customerModal}
          onCancel={() => {
            setCustomerModal(false);
            setShowNewCustomer(false);
          }}
          footer={null}
          title='Select Customer'
        >
          <Input
            placeholder='Search'
            value={customerSearch}
            onChange={e => setCustomerSearch(e.target.value)}
            style={{ marginBottom: 10 }}
            disabled={!isAuthenticated || isLoading} // Disable if not authenticated or loading
          />
          <div style={{ maxHeight: 270, overflowY: 'auto' }}>
            {customers
              .filter(
                c =>
                  c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                  c.phone?.includes(customerSearch) || // Search by phone too
                  c.email?.toLowerCase().includes(customerSearch.toLowerCase()),
              )
              .map(c => (
                <Card
                  key={c.id}
                  style={{ marginBottom: 7, cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedCustomer(c);
                    setCustomerModal(false);
                  }}
                  size='small'
                  bodyStyle={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <Text strong>{c.name}</Text>
                    <div style={{ fontSize: 13, color: '#888' }}>{c.phone}</div>
                    <div style={{ fontSize: 13, color: '#888' }}>{c.email}</div>
                  </div>
                </Card>
              ))}
          </div>
          {!showNewCustomer ? (
            <Button
              block
              type='dashed'
              icon={<PlusOutlined />}
              onClick={() => setShowNewCustomer(true)}
              disabled={!isAuthenticated || isLoading} // Disable if not authenticated or loading
            >
              Add New Customer
            </Button>
          ) : (
            <Form
              form={newCustomerForm}
              onFinish={handleAddCustomer}
              layout='vertical'
              style={{ marginTop: 12 }}
            >
              <Form.Item
                name='name'
                label='Full Name'
                rules={[{ required: true }]}
              >
                <Input disabled={!isAuthenticated || isLoading} />
              </Form.Item>
              <Form.Item
                name='phone'
                label='Phone Number'
                rules={[{ required: true }]}
              >
                <Input disabled={!isAuthenticated || isLoading} />
              </Form.Item>
              <Form.Item
                name='email'
                label='Email (Optional)'
                rules={[{ type: 'email', message: 'Please enter a valid email!' }]}
              >
                <Input disabled={!isAuthenticated || isLoading} />
              </Form.Item>
              <Form.Item name='address' label='Address (Optional)'>
                <Input.TextArea rows={2} disabled={!isAuthenticated || isLoading} />
              </Form.Item>
              <Form.Item name='taxId' label='Tax ID / VAT Number (Optional)'>
                <Input disabled={!isAuthenticated || isLoading} />
              </Form.Item>
              <Button htmlType='submit' type='primary' block disabled={!isAuthenticated || isLoading}>
                Save & Select
              </Button>
            </Form>
          )}
        </Modal>

        <Modal
          open={productModal}
          onCancel={() => {
            setProductModal(false);
            setShowCustomProductForm(false); // Reset custom product form visibility
            setSelectedProduct(null); // Clear selected product
            setProductQty(1); // Reset quantity
            setCustomProductName('');
            setCustomProductUnitPrice(0);
            setCustomProductDescription('');
            setCustomProductTaxRate(0.15);
          }}
          footer={null}
          title='Select Product'
        >
          {!showCustomProductForm ? (
            <>
              <Input
                placeholder='Search existing products'
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                style={{ marginBottom: 10 }}
                disabled={!isAuthenticated || isLoading}
              />
              <div style={{ maxHeight: 270, overflowY: 'auto', marginBottom: 10 }}>
                {products
                  .filter(
                    p =>
                      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                      p.sku?.toLowerCase().includes(productSearch.toLowerCase()),
                  )
                  .map(p => (
                    <Card
                      key={p.id}
                      style={{ marginBottom: 7, cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedProduct(p);
                        setProductModal(false); // Close modal after selection
                      }}
                      size='small'
                      bodyStyle={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <Text strong>{p.name}</Text>
                        <div style={{ fontSize: 13, color: '#888' }}>
                          R{p.unit_price.toFixed(2)} &nbsp; | &nbsp; Stock: {p.stock_quantity ?? 0}{' '}
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
              <Button
                block
                type='dashed'
                icon={<PlusOutlined />}
                onClick={() => {
                  setShowCustomProductForm(true);
                  setSelectedProduct(null); // Clear any selected product
                  setProductSearch(''); // Clear search
                }}
                disabled={!isAuthenticated || isLoading}
              >
                Add Custom Product
              </Button>
            </>
          ) : (
            // Custom Product Form
            <Form layout='vertical' style={{ marginTop: 12 }}>
              <Form.Item label='Product Name' required>
                <Input
                  value={customProductName}
                  onChange={e => setCustomProductName(e.target.value)}
                  placeholder='e.g., Custom Service, Special Item'
                  disabled={!isAuthenticated || isLoading}
                />
              </Form.Item>
              <Form.Item label='Unit Price' required>
                <InputNumber
                  min={0}
                  step={0.01}
                  value={customProductUnitPrice}
                  onChange={value => setCustomProductUnitPrice(value ?? 0)}
                  style={{ width: '100%' }}
                  formatter={value => `R ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value: any) => value.replace(/R\s?|(,*)/g, '')}
                  disabled={!isAuthenticated || isLoading}
                />
              </Form.Item>
              <Form.Item label='Description (Optional)'>
                <Input.TextArea
                  rows={2}
                  value={customProductDescription}
                  onChange={e => setCustomProductDescription(e.target.value)}
                  placeholder='Brief description of the custom item'
                  disabled={!isAuthenticated || isLoading}
                />
              </Form.Item>
              <Form.Item label='Tax Rate' required>
                <Select
                  value={customProductTaxRate.toString()}
                  onChange={value => setCustomProductTaxRate(parseFloat(value))}
                  style={{ width: '100%' }}
                  disabled={!isAuthenticated || isLoading}
                >
                  {VAT_OPTIONS.map((option) => (
                    <Option key={option.value} value={option.value.toString()}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Button
                type='primary'
                block
                onClick={addToCart}
                disabled={!isAuthenticated || isLoading || !customProductName.trim() || customProductUnitPrice <= 0 || productQty <= 0}
              >
                Add Custom Item to Cart
              </Button>
              <Button
                block
                type='default'
                style={{ marginTop: 8 }}
                onClick={() => setShowCustomProductForm(false)}
                disabled={!isAuthenticated || isLoading}
              >
                Back to Existing Products
              </Button>
            </Form>
          )}
        </Modal>
      </div>
    </>
  );
}
