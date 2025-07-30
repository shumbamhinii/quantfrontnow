import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Button,
  Tag,
  Modal,
  Input,
  Typography,
  Row,
  Col,
  message,
  Space,
  Grid,
  Empty,
  Spin,
  Table,
} from 'antd';
import { ShopOutlined, DollarOutlined } from '@ant-design/icons';
import { useAuth } from '../../AuthPage'; // Re-import useAuth
import type { Teller, BranchExpected } from '../types/type'; // Assuming these types are defined in your types file

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

// Hardcoded Data for Demonstration
const HARDCODED_TELLERS: Teller[] = [
  { id: 'teller1', name: 'Zinhle Mpo', email: 'john.doe@example.com', phone: '111-222-3333', position: 'Sales Associate', userRole: 'teller', branch: 'Main Branch' },
  { id: 'teller2', name: 'Audrey Van Wyk', email: 'jane.smith@example.com', phone: '444-555-6666', position: 'Sales Associate', userRole: 'teller', branch: 'Downtown Branch' },
  { id: 'teller3', name: 'Peter Jones', email: 'peter.jones@example.com', phone: '777-888-9999', position: 'Sales Associate', userRole: 'teller', branch: 'Main Branch' },
];

const HARDCODED_SALES_TRANSACTIONS: any[] = [ // Simplified for demonstration
  { id: 'sale1', type: 'sale', amount: 150.75, description: 'Sale 1', date: '2025-07-30T10:00:00Z', category: 'retail', account_id: 'acc1', payment_type: 'Cash', user_id: 'teller1', branch: 'Main Branch', created_at: '2025-07-30T10:00:00Z' },
  { id: 'sale2', type: 'sale', amount: 200.00, description: 'Sale 2', date: '2025-07-30T11:00:00Z', category: 'retail', account_id: 'acc1', payment_type: 'Bank', user_id: 'teller1', branch: 'Main Branch', created_at: '2025-07-30T11:00:00Z' },
  { id: 'sale3', type: 'sale', amount: 50.25, description: 'Sale 3', date: '2025-07-30T12:00:00Z', category: 'retail', account_id: 'acc1', payment_type: 'Credit', user_id: 'teller1', branch: 'Main Branch', created_at: '2025-07-30T12:00:00Z' },
  { id: 'sale4', type: 'sale', amount: 300.50, description: 'Sale 4', date: '2025-07-30T13:00:00Z', category: 'retail', account_id: 'acc2', payment_type: 'Cash', user_id: 'teller2', branch: 'Downtown Branch', created_at: '2025-07-30T13:00:00Z' },
  { id: 'sale5', type: 'sale', amount: 100.00, description: 'Sale 5', date: '2025-07-30T14:00:00Z', category: 'retail', account_id: 'acc2', payment_type: 'Bank', user_id: 'teller2', branch: 'Downtown Branch', created_at: '2025-07-30T14:00:00Z' },
  { id: 'sale6', type: 'sale', amount: 75.00, description: 'Sale 6', date: '2025-07-30T15:00:00Z', category: 'retail', account_id: 'acc3', payment_type: 'Cash', user_id: 'teller3', branch: 'Main Branch', created_at: '2025-07-30T15:00:00Z' },
];


export default function CashInScreen() {
  const [messageApi, contextHolder] = message.useMessage();
  const screens = useBreakpoint();
  const { isAuthenticated } = useAuth(); // Only check isAuthenticated for UI enablement

  const [tellers, setTellers] = useState<Teller[]>([]);
  const [branchExpectedCash, setBranchExpectedCash] = useState<BranchExpected>({});
  const [tellerExpectedCash, setTellerExpectedCash] = useState<Record<string, number>>({});
  const [tellerBankExpected, setTellerBankExpected] = useState<Record<string, number>>({});
  const [tellerCreditExpected, setTellerCreditExpected] = useState<Record<string, number>>({});

  const [cashInModalVisible, setCashInModalVisible] = useState(false);
  const [selectedTeller, setSelectedTeller] = useState<Teller | null>(null);
  const [cashInForm, setCashInForm] = useState<{
    cash: string;
    bank: string;
    credit: string;
  }>({
    cash: '',
    bank: '',
    credit: '',
  });
  const [branchSearch, setBranchSearch] = useState('');
  const [tellerSearch, setTellerSearch] = useState('');
  const [loadingTellers, setLoadingTellers] = useState(true);
  const [loadingExpectedCash, setLoadingExpectedCash] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // New state to trigger re-fetch

  // Helper to simulate authentication check for UI enablement
  const isUserAuthenticated = isAuthenticated; // Use the actual isAuthenticated from context

  const hasTellerSalesToday = (tellerId: string) => {
    return (
      (tellerExpectedCash[tellerId] || 0) > 0 ||
      (tellerBankExpected[tellerId] || 0) > 0 ||
      (tellerCreditExpected[tellerId] || 0) > 0
    );
  };

  // Simulate fetching tellers
  useEffect(() => {
    setLoadingTellers(true);
    // Simulate API call delay
    const timer = setTimeout(() => {
      if (isUserAuthenticated) {
        setTellers(HARDCODED_TELLERS);
        messageApi.success('Tellers loaded successfully (hardcoded).');
      } else {
        setTellers([]);
        messageApi.warning('Authentication required to load tellers.');
      }
      setLoadingTellers(false);
    }, 500); // Simulate network delay
    return () => clearTimeout(timer);
  }, [isUserAuthenticated, messageApi]);

  // Simulate fetching today’s expected cash-in per branch and teller
  useEffect(() => {
    if (!isUserAuthenticated || !tellers.length) {
      setLoadingExpectedCash(false);
      return;
    }

    setLoadingExpectedCash(true);
    const timer = setTimeout(() => {
      const branchCash: BranchExpected = {};
      const tellerCash: Record<string, number> = {};
      const tellerBank: Record<string, number> = {};
      const tellerCredit: Record<string, number> = {};

      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

      // Get unique branches from hardcoded tellers
      const uniqueBranches = Array.from(new Set(HARDCODED_TELLERS.map(t => t.branch)));

      // Initialize all expected values to 0 for all active tellers and branches
      uniqueBranches.forEach(branch => {
        branchCash[branch] = 0;
      });
      HARDCODED_TELLERS.forEach(teller => {
        tellerCash[teller.id] = 0;
        tellerBank[teller.id] = 0;
        tellerCredit[teller.id] = 0;
      });

      // Aggregate hardcoded sales data for today
      HARDCODED_SALES_TRANSACTIONS.forEach(sale => {
        // Check if the sale date is today
        if (sale.date.startsWith(today)) {
          const teller = HARDCODED_TELLERS.find(t => t.id === sale.user_id);
          if (teller) {
            if (sale.payment_type === 'Cash') {
              tellerCash[teller.id] = (tellerCash[teller.id] || 0) + sale.amount;
              branchCash[teller.branch] = (branchCash[teller.branch] || 0) + sale.amount;
            } else if (sale.payment_type === 'Bank') {
              tellerBank[teller.id] = (tellerBank[teller.id] || 0) + sale.amount;
            } else if (sale.payment_type === 'Credit') {
              tellerCredit[teller.id] = (tellerCredit[teller.id] || 0) + sale.amount;
            }
          }
        }
      });

      setBranchExpectedCash(branchCash);
      setTellerExpectedCash(tellerCash);
      setTellerBankExpected(tellerBank);
      setTellerCreditExpected(tellerCredit);
      messageApi.success('Expected sales data loaded successfully (hardcoded).');
      setLoadingExpectedCash(false);
    }, 500); // Simulate network delay
    return () => clearTimeout(timer);
  }, [isUserAuthenticated, tellers, messageApi, refreshTrigger]);


  // Branch summary array
  const activeBranches = Array.from(new Set(tellers.map(t => t.branch)));
  const branchData = activeBranches.map(branch => ({
    branch,
    expected: branchExpectedCash[branch] || 0,
  }));

  const filteredBranchData = branchData.filter(
    (b) =>
      !branchSearch ||
      b.branch.toLowerCase().includes(branchSearch.toLowerCase())
  );

  // Teller list, optionally filtered
  const tellerData = tellers.filter(
    (t) =>
      (!tellerSearch ||
        t.name.toLowerCase().includes(tellerSearch.toLowerCase()) ||
        t.branch.toLowerCase().includes(tellerSearch.toLowerCase())) &&
      hasTellerSalesToday(t.id) // Only show tellers with sales today
  );

  // Open cash-in modal for teller
  const openTellerModal = (teller: Teller) => {
    if (!isUserAuthenticated) {
      messageApi.error('Please log in to record cash-in.');
      return;
    }
    setSelectedTeller(teller);
    setCashInForm({ cash: '', bank: '', credit: '' });
    setCashInModalVisible(true);
  };

  // Simulate saving cash-in
  const handleSubmit = async () => {
    if (!isUserAuthenticated || !selectedTeller) {
      messageApi.error('Authentication or teller information missing.');
      return;
    }

    // Simulate API call delay
    setLoading(true); // Assuming a local loading state for submission
    const timer = setTimeout(() => {
      const expectedCash = tellerExpectedCash[selectedTeller.id] || 0;
      const actualCash = parseFloat(cashInForm.cash) || 0;
      const bankAmount = parseFloat(cashInForm.bank) || 0;
      const creditAmount = parseFloat(cashInForm.credit) || 0;

      let status: 'underpaid' | 'overpaid' | 'exact' = 'exact';
      if (actualCash < expectedCash) status = 'underpaid';
      else if (actualCash > expectedCash) status = 'overpaid';

      console.log('Simulating cash in submission:', {
        tellerId: selectedTeller.id,
        expectedCash,
        actualCash,
        bankAmount,
        creditAmount,
        status,
      });

      messageApi.success(`Cash in recorded for ${selectedTeller.name} (${status}) (Simulated)`);
      setCashInModalVisible(false);
      setSelectedTeller(null);
      setCashInForm({ cash: '', bank: '', credit: '' });

      setRefreshTrigger(prev => prev + 1); // Trigger re-calculation of expected sales data
      setLoading(false);
    }, 1000); // Simulate network delay
    return () => clearTimeout(timer);
  };

  const isLoading = loadingTellers || loadingExpectedCash;

  return (
    <>
      {contextHolder}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 12 }}>
        <Title level={4} style={{ textAlign: 'center', marginBottom: 18 }}>
          Cash In Dashboard
        </Title>

        {isLoading ? (
          <div style={{ textAlign: 'center', marginTop: 50 }}>
            <Spin size="large" tip="Loading data..." />
          </div>
        ) : (
          <>
            {/* Branch summary */}
            <Title level={5} style={{ marginBottom: 8 }}>
              Branch Summary
            </Title>
            <Row gutter={[16, 16]}>
              {filteredBranchData.length === 0 ? (
                <Col span={24}>
                  <Empty description='No branches found' />
                </Col>
              ) : (
                filteredBranchData.map((branch) => (
                  <Col xs={12} sm={12} md={12} key={branch.branch}>
                    <Card
                      size='small'
                      style={{ borderRadius: 10, minHeight: 120 }}
                      styles={{ body: { padding: 18 } }}
                    >
                      <Space align='center' style={{ marginBottom: 10 }}>
                        <ShopOutlined style={{ fontSize: 28, color: '#1677ff' }} />
                        <Title level={5} style={{ margin: 0 }}>
                          {branch.branch}
                        </Title>
                      </Space>
                      <Row gutter={[8, 0]}>
                        <Col span={24}>
                          <Text>
                            Expected Cash In Today: <b>R{branch.expected.toFixed(2)}</b>
                          </Text>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                ))
              )}
            </Row>

            {/* Teller cash-in (table or cards) */}
            <Title level={5} style={{ marginTop: 32, marginBottom: 8 }}>
              Teller Cash-In
            </Title>
            <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
              <Col span={24}>
                <Input.Search
                  placeholder='Search teller or branch...'
                  allowClear
                  value={tellerSearch}
                  onChange={(e) => setTellerSearch(e.target.value)}
                  disabled={!isUserAuthenticated}
                />
              </Col>
            </Row>
            <div
              style={{
                maxHeight: 430,
                overflowY: 'auto',
                paddingRight: 8,
                marginBottom: 24,
              }}
            >
              {tellerData.length === 0 ? (
                <Empty description='No tellers with sales found for today' />
              ) : screens.md ? (
                <Table
                  dataSource={tellerData}
                  rowKey='id'
                  pagination={{ pageSize: 8 }}
                  columns={[
                    {
                      title: 'Teller',
                      dataIndex: 'name',
                      key: 'name',
                      render: (name, record) => (
                        <span>
                          {name} <Tag>{record.branch}</Tag>
                        </span>
                      ),
                    },
                    {
                      title: 'Expected Cash In',
                      key: 'expected',
                      render: (_, rec) => (
                        <span>R{(tellerExpectedCash[rec.id] || 0).toFixed(2)}</span>
                      ),
                    },
                    {
                      title: 'Action',
                      key: 'action',
                      align: 'center',
                      render: (_, rec) => (
                        <Button
                          type='primary'
                          onClick={() => openTellerModal(rec)}
                          disabled={!isUserAuthenticated}
                        >
                          Record Cash-In
                        </Button>
                      ),
                    },
                  ]}
                />
              ) : (
                <Row gutter={[10, 12]}>
                  {tellerData.map((item) => (
                    <Col xs={24} key={item.id}>
                      <Card
                        style={{
                          borderRadius: 10,
                          background: '#fff',
                          marginBottom: 12,
                        }}
                        styles={{ body: { padding: 14 } }}
                        onClick={() => openTellerModal(item)}
                        hoverable
                      >
                        <Row align='middle' justify='space-between'>
                          <Col>
                            <Text strong>{item.name}</Text>
                            <div style={{ color: '#888' }}>
                              Branch: {item.branch}
                            </div>
                            <div>
                              <b>Expected Cash In:</b> R
                              {(tellerExpectedCash[item.id] || 0).toFixed(2)}
                            </div>
                          </Col>
                        </Row>
                        <Button
                          type='primary'
                          block
                          style={{ marginTop: 8 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openTellerModal(item);
                          }}
                          disabled={!isUserAuthenticated}
                        >
                          Record Cash-In
                        </Button>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </div>
          </>
        )}

        {/* --- Cash-In Modal for Teller --- */}
        <Modal
          open={cashInModalVisible}
          title={selectedTeller ? `Cash In - ${selectedTeller.name}` : ''}
          onCancel={() => setCashInModalVisible(false)}
          footer={null}
          centered
          destroyOnClose
          width={350}
          styles={{ body: { padding: 24 } }}
        >
          {selectedTeller && (
            <div>
              <Text strong>Branch: {selectedTeller.branch}</Text>
              <br />
              <Text>
                <b>
                  Expected Cash In: R
                  {(tellerExpectedCash[selectedTeller.id] || 0).toFixed(2)}
                </b>
              </Text>
              <div style={{ margin: '10px 0 6px 0' }}>
                <Text>
                  <span style={{ color: '#1677ff' }}>Bank Sales:</span>{' '}
                  <b>R{(tellerBankExpected[selectedTeller.id] || 0).toFixed(2)}</b>
                </Text>
                <br />
                <Text>
                  <span style={{ color: '#faad14' }}>Credit Sales:</span>{' '}
                  <b>R{(tellerCreditExpected[selectedTeller.id] || 0).toFixed(2)}</b>
                </Text>
              </div>
              <Input
                type='number'
                min={0}
                placeholder='Cash Amount'
                value={cashInForm.cash}
                onChange={(e) =>
                  setCashInForm({ ...cashInForm, cash: e.target.value })
                }
                style={{ margin: '10px 0 18px 0' }}
                disabled={!isUserAuthenticated}
              />
              <Row gutter={8}>
                <Col span={12}>
                  <Button block onClick={() => setCashInModalVisible(false)}>
                    Cancel
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    type='primary'
                    block
                    onClick={handleSubmit}
                    disabled={!cashInForm.cash || !isUserAuthenticated}
                  >
                    Submit
                  </Button>
                </Col>
              </Row>
            </div>
          )}
        </Modal>
      </div>
    </>
  );
}
