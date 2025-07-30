import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from 'antd'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, Save } from 'lucide-react'
import { motion } from 'framer-motion'
import { message } from 'antd' // Add this import

const { TextArea } = Input

export function ProfileForm () {
  const [formData, setFormData] = useState({
    firstName: 'Helper',
    lastName: 'zhou',
    email: 'helper@gmail.com',
    phone: '+27 123 456 789',
    company: 'Quantilytix',
    position: 'Data Analyst',
    address: '123 Business Street',
    city: 'Cape Town',
    province: 'Western Cape',
    postalCode: '8001',
    country: 'South Africa',
    bio: 'Passionate about data analysis and business intelligence.',
    website: 'https://quantilytix.com',
    linkedin: 'https://linkedin.com/in/helper',
    timezone: 'Africa/Johannesburg',
    language: 'English',
    currency: 'ZAR'
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    message.success('Your profile has been successfully updated.')
  }

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='flex items-center space-x-4'>
              <Avatar className='h-20 w-20'>
                <AvatarImage src='/placeholder.svg' />
                <AvatarFallback>HZ</AvatarFallback>
              </Avatar>
              <Button variant='outline' size='sm'>
                <Camera className='h-4 w-4 mr-2' />
                Change Photo
              </Button>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='firstName'>First Name</Label>
                <Input
                  id='firstName'
                  value={formData.firstName}
                  onChange={e => handleInputChange('firstName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor='lastName'>Last Name</Label>
                <Input
                  id='lastName'
                  value={formData.lastName}
                  onChange={e => handleInputChange('lastName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor='phone'>Phone</Label>
                <Input
                  id='phone'
                  value={formData.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor='bio'>Bio</Label>
              <TextArea
                id='bio'
                value={formData.bio}
                onChange={e => handleInputChange('bio', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='company'>Company</Label>
                <Input
                  id='company'
                  value={formData.company}
                  onChange={e => handleInputChange('company', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor='position'>Position</Label>
                <Input
                  id='position'
                  value={formData.position}
                  onChange={e => handleInputChange('position', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor='website'>Website</Label>
                <Input
                  id='website'
                  value={formData.website}
                  onChange={e => handleInputChange('website', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor='linkedin'>LinkedIn</Label>
                <Input
                  id='linkedin'
                  value={formData.linkedin}
                  onChange={e => handleInputChange('linkedin', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Address Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <Label htmlFor='address'>Address</Label>
              <Input
                id='address'
                value={formData.address}
                onChange={e => handleInputChange('address', e.target.value)}
              />
            </div>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <Label htmlFor='city'>City</Label>
                <Input
                  id='city'
                  value={formData.city}
                  onChange={e => handleInputChange('city', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor='province'>Province</Label>
                <Input
                  id='province'
                  value={formData.province}
                  onChange={e => handleInputChange('province', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor='postalCode'>Postal Code</Label>
                <Input
                  id='postalCode'
                  value={formData.postalCode}
                  onChange={e =>
                    handleInputChange('postalCode', e.target.value)
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor='country'>Country</Label>
              <Select
                value={formData.country}
                onValueChange={value => handleInputChange('country', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='South Africa'>South Africa</SelectItem>
                  <SelectItem value='United States'>United States</SelectItem>
                  <SelectItem value='United Kingdom'>United Kingdom</SelectItem>
                  <SelectItem value='Canada'>Canada</SelectItem>
                  <SelectItem value='Australia'>Australia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <Label htmlFor='timezone'>Timezone</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={value => handleInputChange('timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Africa/Johannesburg'>
                      Africa/Johannesburg
                    </SelectItem>
                    <SelectItem value='America/New_York'>
                      America/New_York
                    </SelectItem>
                    <SelectItem value='Europe/London'>Europe/London</SelectItem>
                    <SelectItem value='Asia/Tokyo'>Asia/Tokyo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor='language'>Language</Label>
                <Select
                  value={formData.language}
                  onValueChange={value => handleInputChange('language', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='English'>English</SelectItem>
                    <SelectItem value='Afrikaans'>Afrikaans</SelectItem>
                    <SelectItem value='Zulu'>Zulu</SelectItem>
                    <SelectItem value='Xhosa'>Xhosa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor='currency'>Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={value => handleInputChange('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='ZAR'>
                      ZAR (South African Rand)
                    </SelectItem>
                    <SelectItem value='USD'>USD (US Dollar)</SelectItem>
                    <SelectItem value='GBP'>GBP (British Pound)</SelectItem>
                    <SelectItem value='EUR'>EUR (Euro)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className='flex justify-end'
      >
        <Button onClick={handleSave} className='w-full md:w-auto'>
          <Save className='h-4 w-4 mr-2' />
          Save Profile
        </Button>
      </motion.div>
    </div>
  )
}
