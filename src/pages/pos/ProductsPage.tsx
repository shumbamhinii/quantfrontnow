import { useEffect, useState, useCallback } from 'react';
import {
  Tabs,
  Select,
  Button,
  Drawer,
  Form,
  Input,
  Space,
  Popconfirm,
  message,
  Card,
  Modal,
  Table,
  InputNumber,
  Tag,
  Col,
  Row,
  Spin,
} from 'antd';
import { useMediaQuery } from 'react-responsive';
import POSDashboard from '../../pages/POSDashboard'; // Corrected path if needed
import type { Product } from '../../types/type'; // Assuming these types are defined in your types file
import { useAuth } from '../../AuthPage'; // Import useAuth for isAuthenticated state

// Explicitly import each icon to resolve potential bundling issues
import PlusOutlined from '@ant-design/icons/lib/icons/PlusOutlined';
import EditOutlined from '@ant-design/icons/lib/icons/EditOutlined';
import DeleteOutlined from '@ant-design/icons/lib/icons/DeleteOutlined';
import UploadOutlined from '@ant-design/icons/lib/icons/UploadOutlined';

import ReceiptProductUploader from './ProductReceiptUpload';


// Hardcoded Data for Demonstration
const HARDCODED_PRODUCTS: Product[] = [
  {
    id: 'prod1',
    name: 'Laptop Pro X',
    type: 'product',
    price: 15000.00,
    unitPrice: 15000.00,
    purchasePrice: 12000.00,
    unitPurchasePrice: 12000.00,
    qty: 10,
    minQty: 5,
    maxQty: 20,
    unit: 'units',
    companyName: 'Ngenge Stores',
  },
  {
    id: 'prod2',
    name: 'Premium Coffee Beans',
    type: 'product',
    price: 120.50,
    unitPrice: 120.50,
    purchasePrice: 80.00,
    unitPurchasePrice: 80.00,
    qty: 50,
    minQty: 10,
    maxQty: 100,
    unit: 'bags',
    companyName: 'Ngenge Stores',
  },
  {
    id: 'serv1',
    name: 'Software Consultation (Hr)',
    type: 'service',
    price: 800.00,
    unitPrice: 800.00,
    availableValue: 100, // Example for services
    companyName: 'Ngenge Stores',
  },
  {
    id: 'prod3',
    name: 'Ergonomic Chair',
    type: 'product',
    price: 3500.00,
    unitPrice: 3500.00,
    purchasePrice: 2800.00,
    unitPurchasePrice: 2800.00,
    qty: 5,
    minQty: 2,
    maxQty: 10,
    unit: 'units',
    companyName: 'Ngenge Stores',
  },
];

const HARDCODED_SALES_DATA: any[] = [ // Simplified sales data for bestsellers calculation
  { cart: [{ id: 'prod1', quantity: 3 }, { id: 'prod2', quantity: 10 }] },
  { cart: [{ id: 'prod1', quantity: 1 }, { id: 'serv1', quantity: 5 }] },
  { cart: [{ id: 'prod2', quantity: 15 }] },
];


type ProductFormValues = {
  name: string;
  type: 'product' | 'service';
  sellingPrice: number | string;
  purchasePrice?: number | string;
  unit?: string;
  qty?: number;
  minQty?: number;
  maxQty?: number;
  availableValue?: number;
};

// This hook will now use hardcoded sales data
function useProductSalesStats(products: Product[], isAuthenticated: boolean, messageApi: any) {
  const [bestsellers, setBestsellers] = useState<{ [id: string]: number }>({});

  useEffect(() => {
    if (!isAuthenticated) {
      setBestsellers({});
      return;
    }

    // Simulate API call delay
    const timer = setTimeout(() => {
      const productSales: { [key: string]: number } = {};

      for (const sale of HARDCODED_SALES_DATA) {
        if (Array.isArray(sale.cart)) {
          for (const item of sale.cart) {
            const id = item.id;
            if (!id) continue;
            productSales[id] = (productSales[id] || 0) + (item.quantity || 0);
          }
        }
      }
      setBestsellers(productSales);
      messageApi.success('Sales statistics loaded successfully (hardcoded).');
    }, 500);
    return () => clearTimeout(timer);
  }, [isAuthenticated, products.length, messageApi]);

  return bestsellers;
}

const ProductsPage = () => {
  const { isAuthenticated } = useAuth(); // Only get isAuthenticated from context

  const [messageApi, contextHolder] = message.useMessage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [manualDrawerOpen, setManualDrawerOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [tabKey, setTabKey] = useState('list');
  const [importDrawerOpen, setImportDrawerOpen] = useState(false);
  const [restockModalVisible, setRestockModalVisible] = useState(false);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockForm] = Form.useForm();
  const [formType, setFormType] = useState<'product' | 'service'>('product');
  const isMobile = useMediaQuery({ maxWidth: 767 });

  // Helper to simulate authentication check for UI enablement
  const isUserAuthenticated = isAuthenticated;


  // Simulate fetching products
  const fetchProducts = useCallback(async () => {
    if (!isUserAuthenticated) {
      setLoading(false);
      setProducts([]);
      messageApi.warning('Please log in to load products.');
      return;
    }

    setLoading(true);
    // Simulate API call delay
    const timer = setTimeout(() => {
      // Set products to empty array if no products exist to trigger the empty state UI
      // For demonstration, let's make it empty initially, then load after a delay
      setProducts(HARDCODED_PRODUCTS); // Or [] to test the empty state
      messageApi.success('Products loaded successfully (hardcoded).');
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [isUserAuthenticated, messageApi]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Properly sync form fields & type when modal/drawer is opened and when editingProduct changes
  useEffect(() => {
    if (modalVisible || manualDrawerOpen) {
      if (editingProduct) {
        // Edit mode
        form.setFieldsValue({
          ...editingProduct,
          sellingPrice: editingProduct.unitPrice,
          purchasePrice: editingProduct.purchasePrice,
          type: editingProduct.type,
          qty: editingProduct.qty,
          minQty: editingProduct.minQty,
          maxQty: editingProduct.maxQty,
          availableValue: editingProduct.availableValue,
        });
        setFormType(editingProduct.type);
      } else {
        // Add mode
        form.resetFields();
        form.setFieldsValue({ type: 'product' });
        setFormType('product');
      }
    }
    // eslint-disable-next-line
  }, [modalVisible, manualDrawerOpen, editingProduct]);

  // Always reset everything on close
  const closeForm = () => {
    setModalVisible(false);
    setManualDrawerOpen(false);
    setEditingProduct(null);
    form.resetFields();
    setFormType('product');
  };

  // Use this for both Add and Edit. For Add: openForm(null)
  const openForm = (record: Product | null = null) => {
    if (!isUserAuthenticated) {
      messageApi.error('Please log in to manage products.');
      return;
    }
    setEditingProduct(record);
    if (isMobile) setManualDrawerOpen(true);
    else setModalVisible(true);
  };

  // Simulate Delete product
  const handleDelete = async (id: string) => {
    if (!isUserAuthenticated) {
      messageApi.error('Authentication required to delete products.');
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      const updatedProducts = products.filter(p => p.id !== id);
      setProducts(updatedProducts);
      messageApi.success('Product deleted successfully! (Simulated)');
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  };

  // Simulate Restock product
  const openRestockModal = (product: Product) => {
    if (!isUserAuthenticated) {
      messageApi.error('Please log in to restock products.');
      return;
    }
    setRestockProduct(product);
    restockForm.resetFields();
    setRestockModalVisible(true);
  };

  const handleRestock = async (values: { qty: number; purchasePrice: number }) => {
    if (!isUserAuthenticated || !restockProduct) {
      messageApi.error('Authentication or product information missing for restock.');
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      const updatedProducts = products.map(p => {
        if (p.id === restockProduct.id) {
          return {
            ...p,
            qty: (p.qty ?? 0) + values.qty,
            purchasePrice: values.purchasePrice, // Update purchase price
            unitPurchasePrice: values.purchasePrice, // Assuming same
          };
        }
        return p;
      });
      setProducts(updatedProducts);
      messageApi.success('Product restocked successfully! (Simulated)');
      setRestockModalVisible(false);
      setRestockProduct(null);
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  };

  // Simulate Add or Edit product
  const handleSave = async (values: ProductFormValues) => {
    if (!isUserAuthenticated) {
      messageApi.error('Authentication required to save products. Please ensure you are logged in.');
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      const isNew = !editingProduct;
      const newId = isNew ? `prod${products.length + 1}` : editingProduct!.id;

      const newProduct: Product = {
        id: newId,
        name: values.name,
        type: values.type,
        price: typeof values.sellingPrice === 'number' ? values.sellingPrice : parseFloat(values.sellingPrice),
        unitPrice: typeof values.sellingPrice === 'number' ? values.sellingPrice : parseFloat(values.sellingPrice),
        companyName: 'Ngenge Stores', // Hardcoded company name
        // Set other fields based on type and input
        qty: values.type === 'product' ? (values.qty || 0) : 0,
        minQty: values.type === 'product' ? (values.minQty || 0) : undefined,
        maxQty: values.type === 'product' ? (values.maxQty || 0) : undefined,
        unit: values.type === 'product' ? (values.unit || 'item') : undefined,
        purchasePrice: values.type === 'product' ? (typeof values.purchasePrice === 'number' ? values.purchasePrice : parseFloat(values.purchasePrice || '0')) : undefined,
        unitPurchasePrice: values.type === 'product' ? (typeof values.purchasePrice === 'number' ? values.purchasePrice : parseFloat(values.purchasePrice || '0')) : undefined,
        availableValue: values.type === 'service' ? (values.availableValue || 0) : undefined,
      };

      if (isNew) {
        setProducts([...products, newProduct]);
      } else {
        setProducts(products.map(p => (p.id === newProduct.id ? newProduct : p)));
      }

      messageApi.success(`Product ${isNew ? 'added' : 'updated'} successfully! (Simulated)`);
      closeForm();
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  };

  // Pass isAuthenticated only to useProductSalesStats
  const bestsellers = useProductSalesStats(products, isUserAuthenticated, messageApi);
  const sortedProducts = [...products].sort(
    (a, b) => (bestsellers[b.id] || 0) - (bestsellers[a.id] || 0)
  );

  const filteredProducts = sortedProducts.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const renderForm = () => (
    <Form
      form={form}
      layout='vertical'
      onFinish={handleSave}
      initialValues={{ type: formType }}
      onValuesChange={(changed, all) => {
        if (changed.type) setFormType(changed.type);
      }}
    >
      <Form.Item
        name='type'
        label='Type'
        rules={[{ required: true, message: 'Please select Type' }]}
      >
        <Select placeholder='Select type'>
          <Select.Option value='product'>Product</Select.Option>
          <Select.Option value='service'>Service</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item
        name='name'
        label='Name'
        rules={[{ required: true, message: 'Please enter Name' }]}
      >
        <Input placeholder='Enter name' />
      </Form.Item>
      {/* For products, show selling & purchase price side by side (add only).
          For edit, just show selling price (purchase price can be edited on restock) */}
      {formType === 'product' && !editingProduct ? (
        <Form.Item required>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name='sellingPrice'
                label='Selling Price'
                rules={[{ required: true }]}
                style={{ marginBottom: 0 }}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name='purchasePrice'
                label='Purchase Price'
                rules={[{ required: true }]}
                style={{ marginBottom: 0 }}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form.Item>
      ) : (
        <Form.Item
          name='sellingPrice'
          label='Selling Price'
          rules={[{ required: true }]}
        >
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
      )}

      {formType === 'product' && (
        <>
          <Form.Item name='unit' label='Unit' rules={[{ required: true }]}>
            <Input placeholder='e.g. kg, litre, box' />
          </Form.Item>
          <Form.Item name='qty' label='Quantity'>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item required>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  name='minQty'
                  label='Min Qty'
                  rules={[{ required: true, message: 'Enter Min Qty' }]}
                  style={{ marginBottom: 0 }}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name='maxQty'
                  label='Max Qty'
                  rules={[{ required: true, message: 'Enter Max Qty' }]}
                  style={{ marginBottom: 0 }}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>
        </>
      )}
      {formType === 'service' && (
        <Form.Item
          name='availableValue'
          label='Available Value'
          rules={[{ required: false }]}
        >
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
      )}
      <Form.Item>
        <Button type='primary' htmlType='submit' block disabled={loading}>
          {editingProduct ? 'Update' : 'Create'}
        </Button>
      </Form.Item>
    </Form>
  );

  return (
    <>
      {contextHolder}
      <div className='bg-white p-4 rounded-lg shadow-sm'>
        <Tabs activeKey={tabKey} onChange={key => setTabKey(key)}>
          <Tabs.TabPane tab='Products List' key='list'>
            <div className='flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-4'>
              <h2 className='text-xl font-semibold mb-2 sm:mb-0'>Products</h2>
              <div
                className={
                  isMobile ? 'flex flex-col gap-2 w-full' : 'flex gap-2'
                }
              >
                <Button
                  type='primary'
                  icon={<PlusOutlined />}
                  block={isMobile}
                  onClick={() => openForm(null)}
                  disabled={!isUserAuthenticated}
                >
                  Add Product
                </Button>
                <Button
                  icon={<UploadOutlined />}
                  block={isMobile}
                  onClick={() => setImportDrawerOpen(true)}
                  disabled={!isUserAuthenticated}
                >
                  Scan/Upload Receipt
                </Button>
              </div>
            </div>

            <Input.Search
              placeholder='Search products by name'
              value={search}
              onChange={e => setSearch(e.target.value)}
              className='mb-4'
              allowClear
              disabled={!isUserAuthenticated}
            />

            {loading ? (
              <div style={{ textAlign: 'center', marginTop: 50 }}>
                <Spin size="large" tip="Loading products..." />
              </div>
            ) : (
              filteredProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', border: '1px dashed #d9d9d9', borderRadius: '8px', marginTop: '20px' }}>
                  <p style={{ fontSize: '18px', color: '#595959', marginBottom: '15px' }}>No products found!</p>
                  <p style={{ color: '#8c8c8c', marginBottom: '25px' }}>
                    It looks like you haven't added any products yet.
                    You can add them manually or import from a receipt.
                  </p>
                  <Space>
                    <Button
                      type='primary'
                      icon={<PlusOutlined />}
                      onClick={() => openForm(null)}
                      disabled={!isUserAuthenticated}
                    >
                      Add Product Manually
                    </Button>
                    <Button
                      icon={<UploadOutlined />}
                      onClick={() => setImportDrawerOpen(true)}
                      disabled={!isUserAuthenticated}
                    >
                      Scan/Upload Receipt
                    </Button>
                  </Space>
                </div>
              ) : (
                isMobile ? (
                  <Space direction='vertical' style={{ width: '100%' }}>
                    {filteredProducts.map(product => (
                      <Card
                        key={product.id}
                        title={product.name}
                        size='small'
                        styles={{ body: { padding: 16 } }}
                        extra={
                          <Space>
                            <Button onClick={() => openRestockModal(product)} disabled={!isUserAuthenticated}>
                              Restock
                            </Button>
                            <Button
                              icon={<EditOutlined />}
                              onClick={() => openForm(product)}
                              disabled={!isUserAuthenticated}
                            />
                            <Popconfirm
                              title='Delete product?'
                              onConfirm={() => handleDelete(product.id)}
                              okText='Yes'
                              cancelText='No'
                              disabled={!isUserAuthenticated}
                            >
                              <Button icon={<DeleteOutlined />} danger disabled={!isUserAuthenticated} />
                            </Popconfirm>
                          </Space>
                        }
                      >
                        <p>Type: {product.type}</p>
                        <p>Price: R{product.price || product.unitPrice}</p>
                        <p>
                          <strong>Unit Purchase Price:</strong>{' '}
                          {product.unitPurchasePrice
                            ? `R${product.unitPurchasePrice}`
                            : '-'}
                        </p>
                        <p>
                          <strong>Current Quantity: {product.qty ?? 0}</strong>
                          {product.unit ? ` ${product.unit}` : ''}
                        </p>
                      </Card>
                    ))}
                  </Space>
                ) : (
                  <Table<Product>
                    columns={[
                      { title: 'Name', dataIndex: 'name', key: 'name' },
                      { title: 'Type', dataIndex: 'type', key: 'type' },
                      {
                        title: 'Quantity',
                        dataIndex: 'qty',
                        key: 'qty',
                        render: (qty, rec) =>
                          rec.unit ? `${qty ?? 0} ${rec.unit}` : qty ?? 0,
                      },
                      {
                        title: 'Price',
                        dataIndex: 'price',
                        key: 'price',
                        render: (_, r) => `R${r.unitPrice ?? r.price ?? 0}`,
                      },
                      {
                        title: 'Unit Purchase Price',
                        dataIndex: 'unitPurchasePrice',
                        key: 'unitPurchasePrice',
                        render: val => (val ? `R${val}` : '-'),
                      },
                      {
                        title: 'Actions',
                        key: 'actions',
                        render: (_, record) => (
                          <Space>
                            <Button onClick={() => openRestockModal(record)} disabled={!isUserAuthenticated}>
                              Restock
                            </Button>
                            <Button
                              icon={<EditOutlined />}
                              onClick={() => openForm(record)}
                              disabled={!isUserAuthenticated}
                            />
                            <Popconfirm
                              title='Delete product?'
                              onConfirm={() => handleDelete(record.id)}
                              okText='Yes'
                              cancelText='No'
                              disabled={!isUserAuthenticated}
                            >
                              <Button icon={<DeleteOutlined />} danger disabled={!isUserAuthenticated} />
                            </Popconfirm>
                          </Space>
                        ),
                      },
                    ]}
                    dataSource={filteredProducts}
                    rowKey='id'
                    loading={loading}
                    pagination={{ pageSize: 6 }}
                    scroll={{ x: true }}
                  />
                )
              )
            )}
          </Tabs.TabPane>
          <Tabs.TabPane tab='Statistics' key='statistics'>
            <div className='py-4'>
              <POSDashboard products={products} />
            </div>
          </Tabs.TabPane>
        </Tabs>

        <Drawer
          title={editingProduct ? 'Edit Product' : 'Add Product'}
          open={isMobile && manualDrawerOpen}
          onClose={closeForm}
          placement='bottom'
          height='auto'
        >
          {renderForm()}
        </Drawer>

        <Modal
          title={editingProduct ? 'Edit Product' : 'Add Product'}
          open={!isMobile && modalVisible}
          onCancel={closeForm}
          footer={null}
          styles={{ body: { padding: isMobile ? 12 : 24 } }}
        >
          {renderForm()}
        </Modal>

        {/* Receipt Import Drawer */}
        <Drawer
          title='Import Products from Receipt(s)'
          open={importDrawerOpen}
          onClose={() => setImportDrawerOpen(false)}
          placement={isMobile ? 'bottom' : 'right'}
          height={isMobile ? '100vh' : undefined}
          width={isMobile ? '100vw' : 700}
          destroyOnClose
        >
          <ReceiptProductUploader
            onClose={() => setImportDrawerOpen(false)}
          />
        </Drawer>
      </div>
      <Modal
        open={restockModalVisible}
        title='Restock Product'
        onCancel={() => setRestockModalVisible(false)}
        footer={null}
      >
        <Form form={restockForm} layout='vertical' onFinish={handleRestock}>
          <Form.Item
            name='qty'
            label='Quantity to Add'
            rules={[{ required: true }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name='purchasePrice'
            label='Purchase Price (total price)'
            rules={[{ required: true }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type='primary' htmlType='submit' block disabled={!isUserAuthenticated}>
              Restock
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ProductsPage;
