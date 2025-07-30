import { useState, useCallback } from 'react';
import {
  Button,
  Upload,
  Tabs,
  List,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  message,
  Spin,
  Row,
  Col,
} from 'antd';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';
import { useAuth } from '../../AuthPage'; // Import useAuth

const { Option } = Select;

// Hardcoded Data for Demonstration
interface ProductBackend {
  id?: string;
  name: string;
  description?: string;
  unit_price: number;
  cost_price?: number;
  sku?: string;
  is_service: boolean;
  stock_quantity: number;
  unit?: string;
  min_quantity?: number;
  max_quantity?: number;
  available_value?: number;
  company_name: string;
  created_at?: string;
  updated_at?: string;
}

interface ReceiptItem {
  name: string;
  category: 'stock' | 'service';
  unit_price: number;
  quantity: number;
}

const HARDCODED_RECEIPT_ITEMS: ReceiptItem[] = [
  { name: 'Milk (1L)', category: 'stock', unit_price: 25.00, quantity: 2 },
  { name: 'Bread (White)', category: 'stock', unit_price: 18.50, quantity: 1 },
  { name: 'Software License', category: 'service', unit_price: 500.00, quantity: 1 },
  { name: 'Apples (per kg)', category: 'stock', unit_price: 30.00, quantity: 1.5 },
];

// Utility to convert File to Base64 (still needed for upload component, but won't be sent to real API)
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

const defaultProduct = (item: ReceiptItem) => ({
  name: item.name || '',
  type: item.category === 'stock' ? 'product' : 'service',
  sellingPrice: Number(item.unit_price || 0),
  qty: Number(item.quantity || 1),
  unit: 'item', // Default unit, can be adjusted by user
});

export default function ReceiptProductUploader({
  companyName = 'Ngenge Stores',
  onComplete,
}: {
  companyName?: string;
  onComplete?: () => void;
}) {
  const [tab, setTab] = useState('single');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]); // Products parsed from receipts, ready for editing/saving
  const [form] = Form.useForm();
  const isMobile = useMediaQuery({ maxWidth: 767 });

  // Multipart session state (simulated)
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [parts, setParts] = useState<File[]>([]); // Store actual File objects for display/count

  const { isAuthenticated } = useAuth();

  // Helper to simulate authentication check for UI enablement
  const isUserAuthenticated = isAuthenticated;

  // Simulate Process Single Receipt
  const processSingleReceipt = async (file: File) => {
    if (!isUserAuthenticated) {
      message.error('Authentication required to process receipts.');
      return;
    }
    setLoading(true);
    // Simulate API call delay
    const timer = setTimeout(() => {
      setProducts(HARDCODED_RECEIPT_ITEMS.map(defaultProduct));
      message.success('Receipt processed successfully! (Simulated)');
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  };

  // Simulate Start Multipart Session
  const startSession = async () => {
    if (!isUserAuthenticated) {
      message.error('Authentication required to start a session.');
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      setSessionId('simulated-session-123');
      setParts([]); // Clear any previous parts
      message.success('Multipart session started! (Simulated)');
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  };

  // Simulate Add Part to Multipart Session
  const addPart = async (file: File) => {
    if (!sessionId) {
      message.error('Start a session first.');
      return;
    }
    if (!isUserAuthenticated) {
      message.error('Authentication required to add parts.');
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      setParts((prev) => [...prev, file]);
      message.success('Receipt part added! (Simulated)');
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  };

  // Simulate Process Multipart Session
  const processSession = async () => {
    if (!sessionId) {
      message.error('No session started.');
      return;
    }
    if (!isUserAuthenticated) {
      message.error('Authentication required to process session.');
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      setProducts(HARDCODED_RECEIPT_ITEMS.map(defaultProduct)); // Use same hardcoded data for simplicity
      message.success('Session processed! (Simulated)');
      setLoading(false);
      setSessionId(null); // End session after processing
      setParts([]);
    }, 1500);
    return () => clearTimeout(timer);
  };

  // Simulate Process Bulk Receipts
  const processBulkReceipts = async (files: File[]) => {
    if (!isUserAuthenticated) {
      message.error('Authentication required for bulk processing.');
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      // For bulk, simulate combining items from multiple receipts
      const combinedItems: ReceiptItem[] = [];
      files.forEach(() => {
        combinedItems.push(...HARDCODED_RECEIPT_ITEMS); // Add hardcoded items for each file
      });
      setProducts(combinedItems.map(defaultProduct));
      message.success(`Bulk receipts processed! ${files.length} files (Simulated)`);
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  };

  // Simulate saving all parsed products to the database
  const saveAll = async (values: { products: any[] }) => {
    if (!isUserAuthenticated) {
      message.error('Authentication required to save products.');
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      console.log('Simulating saving products:', values.products);
      message.success('All products saved successfully! (Simulated)');
      setProducts([]); // Clear products after saving
      if (onComplete) onComplete(); // Trigger parent callback
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  };

  // --- RENDER ---

  const renderProductEditor = () => (
    <Form
      form={form}
      initialValues={{ products }}
      onFinish={(vals) => saveAll(vals)}
      autoComplete='off'
      style={{ width: '100%' }}
    >
      <Form.List name='products' initialValue={products}>
        {(fields, { add, remove }) => (
          <div>
            {fields.map((field, idx) =>
              isMobile ? (
                <Card
                  key={field.key}
                  style={{ marginBottom: 16 }}
                  size='small'
                  title={<span>{`Product #${idx + 1}`}</span>}
                  extra={
                    <Button danger onClick={() => remove(field.name)} disabled={loading}>
                      Remove
                    </Button>
                  }
                >
                  <Form.Item
                    name={[field.name, 'name']}
                    label='Name'
                    rules={[{ required: true }]}
                  >
                    <Input disabled={loading} />
                  </Form.Item>
                  <Form.Item
                    name={[field.name, 'type']}
                    label='Type'
                    rules={[{ required: true }]}
                  >
                    <Select disabled={loading}>
                      <Option value='product'>Product</Option>
                      <Option value='service'>Service</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    name={[field.name, 'sellingPrice']}
                    label='Selling Price'
                    rules={[{ required: true }]}
                  >
                    <InputNumber prefix='R' style={{ width: '100%' }} disabled={loading} />
                  </Form.Item>
                  <Form.Item
                    name={[field.name, 'qty']}
                    label='Qty'
                    rules={[{ required: true }]}
                  >
                    <InputNumber min={1} style={{ width: '100%' }} disabled={loading} />
                  </Form.Item>
                  {/* Add purchasePrice and unit fields if needed for editing here */}
                </Card>
              ) : (
                <Row key={field.key} gutter={8} style={{ marginBottom: 8 }}>
                  <Col span={6}>
                    <Form.Item
                      name={[field.name, 'name']}
                      rules={[{ required: true }]}
                    >
                      <Input placeholder='Name' disabled={loading} />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item
                      name={[field.name, 'type']}
                      rules={[{ required: true }]}
                    >
                      <Select disabled={loading}>
                        <Option value='product'>Product</Option>
                        <Option value='service'>Service</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      name={[field.name, 'sellingPrice']}
                      rules={[{ required: true }]}
                    >
                      <InputNumber prefix='R' style={{ width: '100%' }} disabled={loading} />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item
                      name={[field.name, 'qty']}
                      rules={[{ required: true }]}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} disabled={loading} />
                    </Form.Item>
                  </Col>
                  <Col span={2}>
                    <Button danger onClick={() => remove(field.name)} disabled={loading}>
                      Remove
                    </Button>
                  </Col>
                </Row>
              )
            )}
            {products.length === 0 && <div>No products loaded from receipt.</div>}
          </div>
        )}
      </Form.List>
      <Button
        htmlType='submit'
        type='primary'
        block
        disabled={loading || products.length === 0}
      >
        Save All Products
      </Button>
    </Form>
  );

  return (
    <Card
      style={{ maxWidth: 600, margin: 'auto', width: '100%' }}
      styles={{ body: { padding: isMobile ? 12 : 24 } }}
      title='Add Products via Receipt'
    >
      <Tabs activeKey={tab} onChange={setTab}>
        <Tabs.TabPane tab='Single' key='single'>
          <Upload
            accept='image/*'
            showUploadList={false}
            customRequest={({ file }) => processSingleReceipt(file as File)}
            disabled={loading || !isUserAuthenticated}
          >
            <Button icon={<UploadOutlined />} block loading={loading} disabled={loading || !isUserAuthenticated}>
              Upload/Scan Receipt
            </Button>
          </Upload>
        </Tabs.TabPane>
        <Tabs.TabPane tab='Multi-Part' key='multipart'>
          <Space direction='vertical' style={{ width: '100%' }}>
            {!sessionId && (
              <Button
                icon={<PlusOutlined />}
                block
                onClick={startSession}
                loading={loading}
                disabled={loading || !isUserAuthenticated}
              >
                Start Multipart Session
              </Button>
            )}
            {sessionId && (
              <>
                <Upload
                  accept='image/*'
                  showUploadList={false}
                  customRequest={({ file }) => addPart(file as File)}
                  disabled={loading || !isUserAuthenticated}
                >
                  <Button icon={<UploadOutlined />} block loading={loading} disabled={loading || !isUserAuthenticated}>
                    Add Receipt Part
                  </Button>
                </Upload>
                <Button
                  type='primary'
                  block
                  onClick={processSession}
                  loading={loading}
                  style={{ marginTop: 8 }}
                  disabled={loading || !isUserAuthenticated}
                >
                  Process Session
                </Button>
                <div>Parts uploaded: {parts.length}</div>
              </>
            )}
          </Space>
        </Tabs.TabPane>
        <Tabs.TabPane tab='Bulk' key='bulk'>
          <Upload
            accept='image/*'
            multiple
            showUploadList={false}
            customRequest={({ fileList }) =>
              processBulkReceipts(fileList.map((f) => f.originFileObj || f) as File[])
            }
            disabled={loading || !isUserAuthenticated}
          >
            <Button icon={<UploadOutlined />} block loading={loading} disabled={loading || !isUserAuthenticated}>
              Upload Multiple Receipts
            </Button>
          </Upload>
        </Tabs.TabPane>
      </Tabs>

      {loading && <Spin style={{ margin: 20 }} />}

      {products.length > 0 && (
        <div style={{ marginTop: 24 }}>{renderProductEditor()}</div>
      )}
    </Card>
  );
}
