import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Tabs,
  Tag,
  Button,
  Modal,
  Input,
  Spin,
  Typography,
  message,
  Row,
  Col,
} from 'antd';
import { UserOutlined, SearchOutlined } from '@ant-design/icons';
import { useAuth } from '../../AuthPage'; // Import useAuth

const { Title, Text } = Typography;

// Hardcoded Data for Demonstration
interface CustomerBackend {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  total_invoiced: number;
}

interface InvoiceBackend {
  id: string;
  customer_id: string;
  customer_name: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  amount_paid: number;
  status: 'Pending' | 'Paid' | 'Overdue' | 'Partially Paid';
  company_name: string;
  created_at: string;
  updated_at: string;
}

const HARDCODED_CUSTOMERS: CustomerBackend[] = [
  { id: 'cust1', name: 'Alice Johnson', email: 'alice@example.com', total_invoiced: 1200 },
  { id: 'cust2', name: 'Bob Williams', email: 'bob@example.com', total_invoiced: 800 },
  { id: 'cust3', name: 'Charlie Brown', email: 'charlie@example.com', total_invoiced: 2500 },
];

const HARDCODED_INVOICES: InvoiceBackend[] = [
  { id: 'inv1', customer_id: 'cust1', customer_name: 'Alice Johnson', invoice_date: '2025-07-01T00:00:00Z', due_date: '2025-07-15T00:00:00Z', total_amount: 500, amount_paid: 200, status: 'Partially Paid', company_name: 'Ngenge Stores', created_at: '', updated_at: '' },
  { id: 'inv2', customer_id: 'cust1', customer_name: 'Alice Johnson', invoice_date: '2025-06-20T00:00:00Z', due_date: '2025-07-05T00:00:00Z', total_amount: 700, amount_paid: 0, status: 'Overdue', company_name: 'Ngenge Stores', created_at: '', updated_at: '' },
  { id: 'inv3', customer_id: 'cust2', customer_name: 'Bob Williams', invoice_date: '2025-07-10T00:00:00Z', due_date: '2025-07-25T00:00:00Z', total_amount: 800, amount_paid: 0, status: 'Pending', company_name: 'Ngenge Stores', created_at: '', updated_at: '' },
  { id: 'inv4', customer_id: 'cust3', customer_name: 'Charlie Brown', invoice_date: '2025-07-05T00:00:00Z', due_date: '2025-07-20T00:00:00Z', total_amount: 1000, amount_paid: 1000, status: 'Paid', company_name: 'Ngenge Stores', created_at: '', updated_at: '' },
  { id: 'inv5', customer_id: 'cust3', customer_name: 'Charlie Brown', invoice_date: '2025-07-20T00:00:00Z', due_date: '2025-08-05T00:00:00Z', total_amount: 1500, amount_paid: 0, status: 'Pending', company_name: 'Ngenge Stores', created_at: '', updated_at: '' },
];

type Credit = {
  id: string; // Invoice ID
  name: string; // Customer Name
  amountDue: number; // total_amount - amount_paid (for current payments) or total_amount (for history)
  paidAmount: number; // amount_paid
  dueDate: string; // invoice_date or due_date depending on what you want to show
  creditScore: number; // This will be a dummy value as there's no direct API for it
};

const CreditPaymentsScreen: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [tab, setTab] = useState<'payments' | 'history'>('payments');
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [customerModal, setCustomerModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [customersList, setCustomersList] = useState<CustomerBackend[]>([]); // For customer selection in history tab

  const { isAuthenticated } = useAuth();

  // Helper to simulate authentication check for UI enablement
  const isUserAuthenticated = isAuthenticated;

  // Simulate fetching all invoices (as credits)
  const fetchCredits = useCallback(async () => {
    setLoading(true);
    // Simulate API call delay
    const timer = setTimeout(() => {
      if (isUserAuthenticated) {
        const activeCredits: Credit[] = HARDCODED_INVOICES
          .filter((invoice) => invoice.status !== 'Paid' && (invoice.total_amount - invoice.amount_paid) > 0)
          .map((invoice) => ({
            id: invoice.id,
            name: invoice.customer_name,
            amountDue: invoice.total_amount, // Original total amount
            paidAmount: invoice.amount_paid,
            dueDate: invoice.due_date.split('T')[0], // Format to YYYY-MM-DD
            creditScore: Math.floor(Math.random() * 30) + 60, // Dummy credit score (60-90)
          }));
        setCredits(activeCredits);
        messageApi.success('Credits loaded successfully (hardcoded).');
      } else {
        setCredits([]);
        messageApi.warning('Please log in to load credits.');
      }
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [isUserAuthenticated, messageApi]);

  // Simulate fetching all customers for the history tab dropdown
  const fetchCustomers = useCallback(async () => {
    // Simulate API call delay
    const timer = setTimeout(() => {
      if (isUserAuthenticated) {
        setCustomersList(HARDCODED_CUSTOMERS);
        messageApi.success('Customers loaded successfully (hardcoded).');
      } else {
        setCustomersList([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [isUserAuthenticated, messageApi]);

  useEffect(() => {
    fetchCredits();
    fetchCustomers();
  }, [fetchCredits, fetchCustomers]);

  // Customers (derived from fetched customersList)
  const customers = customersList.map(c => c.name?.trim()).sort();
  const filteredCustomers = customers.filter(c =>
    c?.toLowerCase().includes(searchText.toLowerCase())
  );

  // Filtered credits for history tab (all invoices for selected customer)
  const filteredCreditsHistory = useCallback(async () => {
    if (!selectedCustomer || !isUserAuthenticated) {
      return [];
    }
    // Simulate API call delay
    return new Promise<Credit[]>(resolve => {
      setTimeout(() => {
        const customer = HARDCODED_CUSTOMERS.find(c => c.name?.trim().toLowerCase() === selectedCustomer.trim().toLowerCase());
        if (!customer) {
          resolve([]);
          return;
        }

        const customerInvoices = HARDCODED_INVOICES.filter(inv => inv.customer_id === customer.id);
        const historyData: Credit[] = customerInvoices
          .map((invoice) => ({
            id: invoice.id,
            name: invoice.customer_name,
            amountDue: invoice.total_amount, // For history, show total original amount
            paidAmount: invoice.amount_paid,
            dueDate: invoice.due_date.split('T')[0],
            creditScore: Math.floor(Math.random() * 30) + 60, // Dummy credit score
          }))
          .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
        resolve(historyData);
      }, 300); // Simulate network delay
    });
  }, [selectedCustomer, isUserAuthenticated]);

  const [historyCredits, setHistoryCredits] = useState<Credit[]>([]);
  useEffect(() => {
    if (tab === 'history') {
      setLoading(true);
      filteredCreditsHistory().then(data => {
        setHistoryCredits(data);
        setLoading(false);
      });
    }
  }, [tab, selectedCustomer, filteredCreditsHistory]);


  // Payment logic (simulated)
  const openModal = (credit: Credit) => {
    if (!isUserAuthenticated) {
      messageApi.error('Authentication required to make payments.');
      return;
    }
    setSelectedCredit(credit);
    setPaymentAmount('');
    setModalVisible(true);
  };

  const handlePayment = async () => {
    if (!selectedCredit || !isUserAuthenticated) {
      messageApi.error('Authentication or credit not selected.');
      return;
    }
    const payAmount = parseFloat(paymentAmount);
    if (
      !payAmount ||
      payAmount <= 0 ||
      payAmount > (selectedCredit.amountDue - selectedCredit.paidAmount)
    ) {
      messageApi.warning('Invalid payment amount');
      return;
    }

    setLoading(true); // Set loading for payment process
    // Simulate API call delay
    const timer = setTimeout(() => {
      // Simulate updating the hardcoded data (for demonstration purposes, this won't persist)
      const updatedInvoices = HARDCODED_INVOICES.map(inv => {
        if (inv.id === selectedCredit.id) {
          const newPaidAmount = inv.amount_paid + payAmount;
          const newStatus = newPaidAmount >= inv.total_amount ? 'Paid' : 'Partially Paid';
          return { ...inv, amount_paid: newPaidAmount, status: newStatus };
        }
        return inv;
      });
      // In a real app, you'd send this update to your backend.

      messageApi.success('Payment recorded successfully! (Simulated)');
      setModalVisible(false);
      setSelectedCredit(null);
      fetchCredits(); // Re-fetch credits to update the list
      if (tab === 'history') { // Also update history if currently on that tab
        filteredCreditsHistory().then(setHistoryCredits);
      }
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  };

  // Credit score color
  const getCreditScoreColor = (score: number) => {
    if (score >= 75) return 'green';
    if (score >= 70) return 'gold';
    return 'red';
  };

  // Due status chip
  const dueStatus = (credit: Credit): [string, string] => {
    const today = new Date().toISOString().slice(0, 10);
    const remainingDue = credit.amountDue - credit.paidAmount;

    if (remainingDue <= 0) return ['Paid', 'blue'];
    if (credit.dueDate < today) return ['Overdue', 'red'];
    if (credit.dueDate === today) return ['Due Today', 'gold'];
    return ['On Time', 'green'];
  };

  // Responsive Card Style
  const cardStyle: React.CSSProperties = {
    marginBottom: 16,
    background: '#fff',
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    cursor: 'pointer',
  };

  return (
    <>
      {contextHolder}
      <div style={{ padding: 12, maxWidth: 480, margin: '0 auto' }}>
        <Title level={4} style={{ textAlign: 'center', marginBottom: 8 }}>
          Credit Payments
        </Title>

        <Tabs
          activeKey={tab}
          onChange={(key) => {
            setTab(key as 'payments' | 'history');
            setSelectedCustomer(null); // Reset selected customer when changing tabs
            setSearchText(''); // Reset search text
          }}
          centered
          items={[
            { key: 'payments', label: 'Payments' },
            { key: 'history', label: 'History' },
          ]}
          style={{ marginBottom: 18 }}
        />

        <div style={{ minHeight: 380 }}>
          {tab === 'payments' ? (
            loading ? (
              <div style={{ textAlign: 'center', marginTop: 40 }}>
                <Spin />
              </div>
            ) : credits.length === 0 ? (
              <Text
                type='secondary'
                style={{ display: 'block', marginTop: 40, textAlign: 'center' }}
              >
                No outstanding credits found.
              </Text>
            ) : (
              credits.map((credit) => {
                const remainingDue = (
                  credit.amountDue - credit.paidAmount
                ).toFixed(2);
                const [status, color] = dueStatus(credit);
                return (
                  <Card
                    key={credit.id}
                    style={cardStyle}
                    onClick={() => openModal(credit)}
                    styles={{ body: { padding: 16 } }}
                  >
                    <Row align='middle' wrap={false}>
                      <Col flex='auto'>
                        <Text strong style={{ color: '#111' }}>
                          {credit.name}
                        </Text>
                        <div>
                          Amount Due: <b>R{remainingDue}</b>
                        </div>
                        <div>Due: {credit.dueDate}</div>
                      </Col>
                      <Col>
                        <Tag
                          color={getCreditScoreColor(credit.creditScore)}
                          style={{ marginBottom: 5 }}
                        >
                          {credit.creditScore}
                        </Tag>
                        <Tag color={color}>{status}</Tag>
                      </Col>
                    </Row>
                  </Card>
                );
              })
            )
          ) : (
            <>
              {/* Customer Picker */}
              <Card
                style={{
                  ...cardStyle,
                  padding: 8,
                  cursor: 'pointer',
                  marginBottom: 16,
                }}
                onClick={() => {
                  if (isUserAuthenticated) {
                    setCustomerModal(true);
                  } else {
                    messageApi.error('Authentication required to select customers.');
                  }
                }}
              >
                <Row align='middle'>
                  <Col>
                    <UserOutlined style={{ fontSize: 18, marginRight: 8 }} />
                    {selectedCustomer
                      ? `Customer: ${selectedCustomer}`
                      : 'Select Customer'}
                  </Col>
                  <Col flex='auto' style={{ textAlign: 'right' }}>
                    <SearchOutlined />
                  </Col>
                </Row>
              </Card>

              {/* Credit History */}
              {loading ? (
                <div style={{ textAlign: 'center', marginTop: 40 }}>
                  <Spin />
                </div>
              ) : selectedCustomer && historyCredits.length > 0 ? (
                historyCredits.map((c) => {
                  const [status, color] = dueStatus(c);
                  return (
                    <Card
                      key={`${c.id}-${c.dueDate}`}
                      style={cardStyle}
                      styles={{ body: { padding: 16 } }}
                    >
                      <Row align='middle' wrap={false}>
                        <Col flex='auto'>
                          <Text strong>{c.name}</Text>
                          <div>
                            Original Amount: <b>R{c.amountDue.toFixed(2)}</b>
                          </div>
                          <div>
                            Paid: <b>R{c.paidAmount.toFixed(2)}</b>
                          </div>
                          <div>Due Date: {c.dueDate}</div>
                        </Col>
                        <Col>
                          <Tag
                            color={getCreditScoreColor(c.creditScore)}
                            style={{ marginBottom: 5 }}
                          >
                            {c.creditScore}
                          </Tag>
                          <Tag color={color}>{status}</Tag>
                        </Col>
                      </Row>
                    </Card>
                  );
                })
              ) : (
                <Text
                  type='secondary'
                  style={{
                    display: 'block',
                    marginTop: 40,
                    textAlign: 'center',
                  }}
                >
                  {selectedCustomer
                    ? 'No previous credits found for this customer.'
                    : 'Please select a customer to view their history.'}
                </Text>
              )}
            </>
          )}
        </div>

        {/* Payment Modal */}
        <Modal
          open={modalVisible}
          centered
          footer={null}
          onCancel={() => setModalVisible(false)}
          destroyOnClose
          width={340}
          styles={{ body: { padding: 24 } }}
        >
          {selectedCredit && (
            <>
              <Title level={5} style={{ marginBottom: 4 }}>
                Pay {selectedCredit.name}
              </Title>
              <Text>
                Remaining:{' '}
                <b>
                  R
                  {(
                    selectedCredit.amountDue - selectedCredit.paidAmount
                  ).toFixed(2)}
                </b>
              </Text>
              <div style={{ margin: '12px 0' }}>
                <Tag color={getCreditScoreColor(selectedCredit.creditScore)}>
                  {selectedCredit.creditScore}
                </Tag>
              </div>
              <Input
                type='number'
                placeholder='Payment Amount'
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                style={{ margin: '12px 0 6px 0' }}
                min={0}
                disabled={!isUserAuthenticated || loading}
              />
              <Button type='primary' block onClick={handlePayment} disabled={!isUserAuthenticated || loading}>
                Confirm Payment
              </Button>
            </>
          )}
        </Modal>

        {/* Customer Selector Modal */}
        <Modal
          open={customerModal}
          centered
          footer={null}
          onCancel={() => setCustomerModal(false)}
          destroyOnClose
          width={340}
          styles={{ body: { padding: 20 } }}
        >
          <Title level={5} style={{ marginBottom: 12 }}>
            Select Customer
          </Title>
          <Input
            placeholder='Search by name...'
            value={searchText}
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            style={{ marginBottom: 10 }}
            disabled={!isUserAuthenticated}
          />
          <div style={{ maxHeight: 250, overflowY: 'auto' }}>
            {filteredCustomers.map((item) => (
              <Card
                key={item}
                style={{ marginBottom: 8, cursor: 'pointer', padding: 8 }}
                styles={{ body: { padding: 10 } }}
                onClick={() => {
                  if (isUserAuthenticated) {
                    setSelectedCustomer(item);
                    setCustomerModal(false);
                  } else {
                    messageApi.error('Authentication required to select customers.');
                  }
                }}
              >
                <Text>{item}</Text>
              </Card>
            ))}
            {!filteredCustomers.length && (
              <Text type='secondary'>No customers found.</Text>
            )}
          </div>
        </Modal>
      </div>
    </>
  );
};

export default CreditPaymentsScreen;
