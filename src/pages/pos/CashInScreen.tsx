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
  Form,
  InputNumber,
} from 'antd';
import { ShopOutlined, DollarOutlined } from '@ant-design/icons';
import { useAuth } from '../../AuthPage';
import axios from 'axios';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

// --- Backend Data Interfaces ---
interface Teller {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  userRole: 'teller' | 'manager';
  branch: string;
}

interface ExpectedCash {
  cash: number;
  bank: number;
  credit: number;
}

// Placeholder for your backend API URL
const API_BASE_URL = 'http://localhost:3000';

export default function CashInScreen() {
  const [messageApi, contextHolder] = message.useMessage();
  const screens = useBreakpoint();
  const { isAuthenticated, user } = useAuth();
  const token = localStorage.getItem('token');

  const [tellers, setTellers] = useState<Teller[]>([]);
  const [tellerExpectedCash, setTellerExpectedCash] = useState<Record<string, ExpectedCash>>({});
  
  const [reconciliationModalVisible, setReconciliationModalVisible] = useState(false);
  const [selectedTeller, setSelectedTeller] = useState<Teller | null>(null);
  const [countedCash, setCountedCash] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>('');

  const [loadingTellers, setLoadingTellers] = useState(true);
  const [loadingExpectedCash, setLoadingExpectedCash] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tellerSearch, setTellerSearch] = useState('');

  const getAuthHeaders = useCallback(() => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }, [token]);

  // Fetches the list of tellers
  const fetchTellers = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setTellers([]);
      setLoadingTellers(false);
      return;
    }
    setLoadingTellers(true);
    try {
      // NOTE: Replace with your actual API endpoint to fetch tellers
      const response = await axios.get<Teller[]>(`${API_BASE_URL}/api/tellers`, {
        headers: getAuthHeaders(),
      });
      setTellers(response.data);
    } catch (error) {
      console.error('Failed to fetch tellers:', error);
      messageApi.error('Failed to load tellers.');
      setTellers([]);
    } finally {
      setLoadingTellers(false);
    }
  }, [isAuthenticated, token, getAuthHeaders, messageApi]);

  // Fetches today's expected cash for all tellers
  const fetchExpectedCash = useCallback(async () => {
    if (!isAuthenticated || !token || tellers.length === 0) {
      setLoadingExpectedCash(false);
      return;
    }
    setLoadingExpectedCash(true);
    try {
      // NOTE: This endpoint should calculate and return the expected cash for each teller for the current day.
      // This is a key part of your anti-fraud logic.
      const response = await axios.get<Record<string, ExpectedCash>>(`${API_BASE_URL}/api/reconciliation/expected`, {
        headers: getAuthHeaders(),
      });
      setTellerExpectedCash(response.data);
    } catch (error) {
      console.error('Failed to fetch expected cash:', error);
      messageApi.error('Failed to load expected cash data.');
      setTellerExpectedCash({});
    } finally {
      setLoadingExpectedCash(false);
    }
  }, [isAuthenticated, token, tellers, getAuthHeaders, messageApi]);


  useEffect(() => {
    fetchTellers();
  }, [fetchTellers]);

  useEffect(() => {
    if (tellers.length > 0) {
      fetchExpectedCash();
    }
  }, [tellers, fetchExpectedCash]);


  // Filter tellers for the display list
  const tellerData = tellers.filter((t) => {
    const hasSalesToday = (tellerExpectedCash[t.id]?.cash || 0) > 0;
    const matchesSearch = !tellerSearch || t.name.toLowerCase().includes(tellerSearch.toLowerCase()) || t.branch.toLowerCase().includes(tellerSearch.toLowerCase());
    return hasSalesToday && matchesSearch;
  });

  // Open reconciliation modal
  const openReconciliationModal = (teller: Teller) => {
    if (!isAuthenticated) {
      messageApi.error('Please log in to record reconciliation.');
      return;
    }
    setSelectedTeller(teller);
    setCountedCash(null);
    setNotes('');
    setReconciliationModalVisible(true);
  };

  // Submit the reconciliation data
  const handleSubmit = async () => {
    if (!isAuthenticated || !selectedTeller) {
      messageApi.error('Authentication or teller information missing.');
      return;
    }

    const expectedCash = tellerExpectedCash[selectedTeller.id]?.cash || 0;
    const variance = (countedCash || 0) - expectedCash;

    if (countedCash === null) {
      messageApi.error('Please enter the counted cash amount.');
      return;
    }

    setSubmitting(true);
    try {
      // NOTE: This is the critical POST request for recording the reconciliation.
      await axios.post(`${API_BASE_URL}/api/reconciliation/submit`, {
        tellerId: selectedTeller.id,
        expectedCash,
        countedCash,
        variance,
        notes,
        recordedBy: user?.id, // Assumes user.id is the admin/manager ID
        date: new Date().toISOString(),
      }, {
        headers: getAuthHeaders(),
      });

      messageApi.success(`Reconciliation recorded for ${selectedTeller.name}.`);
      setReconciliationModalVisible(false);
      setSelectedTeller(null);
      // Re-fetch expected cash to update the dashboard
      fetchExpectedCash();
    } catch (error) {
      console.error('Failed to submit reconciliation:', error);
      messageApi.error('Failed to submit reconciliation report.');
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = loadingTellers || loadingExpectedCash;
  const expectedCashForSelected = selectedTeller ? tellerExpectedCash[selectedTeller.id] : { cash: 0, bank: 0, credit: 0 };
  const variance = (countedCash || 0) - (expectedCashForSelected?.cash || 0);

  return (
    <>
      {contextHolder}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 12 }}>
        <Title level={4} style={{ textAlign: 'center', marginBottom: 18 }}>
          Teller Reconciliation Dashboard
        </Title>

        {isLoading ? (
          <div style={{ textAlign: 'center', marginTop: 50 }}>
            <Spin size="large" tip="Loading data..." />
          </div>
        ) : (
          <>
            <Title level={5} style={{ marginTop: 32, marginBottom: 8 }}>
              Tellers with Cash Sales Today
            </Title>
            <Input.Search
              placeholder='Search teller or branch...'
              allowClear
              value={tellerSearch}
              onChange={(e) => setTellerSearch(e.target.value)}
              disabled={!isAuthenticated}
              style={{ marginBottom: 16 }}
            />
            <div style={{ maxHeight: 430, overflowY: 'auto', paddingRight: 8, marginBottom: 24 }}>
              {tellerData.length === 0 ? (
                <Empty description='No tellers with cash sales found for today' />
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
                        <span>R{(tellerExpectedCash[rec.id]?.cash || 0).toFixed(2)}</span>
                      ),
                    },
                    {
                      title: 'Action',
                      key: 'action',
                      align: 'center',
                      render: (_, rec) => (
                        <Button
                          type='primary'
                          onClick={() => openReconciliationModal(rec)}
                          disabled={!isAuthenticated || submitting}
                        >
                          Record Reconciliation
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
                        style={{ borderRadius: 10, background: '#fff', marginBottom: 12 }}
                        styles={{ body: { padding: 14 } }}
                        onClick={() => openReconciliationModal(item)}
                        hoverable
                      >
                        <Row align='middle' justify='space-between'>
                          <Col>
                            <Text strong>{item.name}</Text>
                            <div style={{ color: '#888' }}>Branch: {item.branch}</div>
                            <div>
                              <b>Expected Cash In:</b> R{(tellerExpectedCash[item.id]?.cash || 0).toFixed(2)}
                            </div>
                          </Col>
                          <Col>
                            <Button
                              type='primary'
                              onClick={(e) => {
                                e.stopPropagation();
                                openReconciliationModal(item);
                              }}
                              disabled={!isAuthenticated || submitting}
                            >
                              Record
                            </Button>
                          </Col>
                        </Row>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </div>
          </>
        )}

        {/* --- Reconciliation Modal --- */}
        <Modal
          open={reconciliationModalVisible}
          title={selectedTeller ? `Daily Reconciliation: ${selectedTeller.name}` : ''}
          onCancel={() => setReconciliationModalVisible(false)}
          footer={null}
          centered
          destroyOnClose
          width={400}
          styles={{ body: { padding: 24 } }}
        >
          {selectedTeller && (
            <Form layout='vertical' onFinish={handleSubmit}>
              <Text strong>Branch: {selectedTeller.branch}</Text>
              <br />
              <div style={{ margin: '10px 0' }}>
                <Text>
                  <span style={{ color: '#1677ff' }}>Bank Sales:</span>{' '}
                  <b>R{(expectedCashForSelected.bank || 0).toFixed(2)}</b>
                </Text>
                <br />
                <Text>
                  <span style={{ color: '#faad14' }}>Credit Sales:</span>{' '}
                  <b>R{(expectedCashForSelected.credit || 0).toFixed(2)}</b>
                </Text>
              </div>

              <Form.Item label='Expected Cash In' style={{ marginBottom: 0 }}>
                <Input
                  addonBefore={<DollarOutlined />}
                  value={`R${(expectedCashForSelected.cash || 0).toFixed(2)}`}
                  disabled
                />
              </Form.Item>
              
              <Form.Item
                label='Counted Cash'
                name='countedCash'
                rules={[{ required: true, message: 'Please enter the counted cash.' }]}
                style={{ marginTop: 16 }}
              >
                <InputNumber
                  addonBefore={<DollarOutlined />}
                  style={{ width: '100%' }}
                  placeholder='Enter actual cash amount'
                  value={countedCash}
                  onChange={(value) => setCountedCash(value)}
                  min={0}
                  step={0.01}
                  precision={2}
                  disabled={submitting}
                />
              </Form.Item>

              <Form.Item label='Variance' style={{ marginBottom: 0 }}>
                <Input
                  value={`R${variance.toFixed(2)}`}
                  style={{
                    color: variance === 0 ? 'green' : variance > 0 ? 'blue' : 'red',
                    fontWeight: 'bold',
                  }}
                  disabled
                />
              </Form.Item>

              <Form.Item label='Notes (if variance exists)' name='notes' style={{ marginTop: 16 }}>
                <Input.TextArea
                  rows={3}
                  placeholder='Explain any discrepancies...'
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={submitting}
                />
              </Form.Item>

              <Row gutter={8}>
                <Col span={12}>
                  <Button block onClick={() => setReconciliationModalVisible(false)} disabled={submitting}>
                    Cancel
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    type='primary'
                    block
                    htmlType='submit'
                    loading={submitting}
                    disabled={!countedCash && countedCash !== 0}
                  >
                    Submit Reconciliation
                  </Button>
                </Col>
              </Row>
            </Form>
          )}
        </Modal>
      </div>
    </>
  );
}
