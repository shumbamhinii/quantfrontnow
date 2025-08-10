import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input, message } from 'antd';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Save } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '../../AuthPage';

const { TextArea } = Input;

export function ProfileForm() {
  const { isAuthenticated } = useAuth();
  const token = localStorage.getItem('token');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    country: '',
    bio: '',
    website: '',
    linkedin: '',
    timezone: '',
    language: '',
    currency: '',
    userId: '',
  });

  const [loading, setLoading] = useState(true);
const [changePassword, setChangePassword] = useState(false);
const [newPassword, setNewPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isAuthenticated || !token) return;
      try {
        const res = await fetch('https://quantnow.onrender.com/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        const [firstName, ...lastNameParts] = data.name.split(' ');
        setFormData({
          ...formData,
          firstName,
          lastName: lastNameParts.join(' '),
          email: data.email,
          phone: data.phone,
          address: data.address,
          company: data.company,
          position: data.position,
          city: data.city,
          province: data.province,
          postalCode: data.postal_code,
          country: data.country,
          bio: data.bio,
          website: data.website,
          linkedin: data.linkedin,
          timezone: data.timezone,
          language: data.language,
          currency: data.currency,
          userId: data.user_id,
        });
      } catch (err) {
        message.error('Could not fetch profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [isAuthenticated, token]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

const handleSave = async () => {
  if (!isAuthenticated || !token) return;
  try {
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    const payload = {
      name: fullName,
      contact_person: fullName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      company: formData.company,
      position: formData.position,
      city: formData.city,
      province: formData.province,
      postal_code: formData.postalCode,
      country: formData.country,
      bio: formData.bio,
      website: formData.website,
      linkedin: formData.linkedin,
      timezone: formData.timezone,
      language: formData.language,
      currency: formData.currency,
      user_id: formData.userId,
    };

    // Update profile
    const res = await fetch('https://quantnow.onrender.com/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error('Profile update failed');

    // If password change is requested
    if (changePassword) {
      if (!newPassword || newPassword !== confirmPassword || newPassword.length < 6) {
        message.error('Passwords must match and be at least 6 characters.');
        return;
      }

      const passRes = await fetch('https://quantnow.onrender.com/api/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!passRes.ok) throw new Error('Password update failed');
    }

    message.success('Profile saved successfully');
  } catch (err) {
    console.error(err);
    message.error('Failed to save');
  }
};



  if (loading) return <Skeleton className='h-[200px] w-full' />;


 

  

  return (
    
    <div className='max-w-4xl mx-auto space-y-6'>
      <Card>
        <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center space-x-4'>
            <Avatar className='h-20 w-20'>
              <AvatarImage src='/placeholder.svg' />
              <AvatarFallback>{formData.firstName[0]}{formData.lastName[0]}</AvatarFallback>
            </Avatar>
            <Button variant='outline' size='sm' disabled>
              <Camera className='h-4 w-4 mr-2' /> Change Photo
            </Button>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Input placeholder='First Name' value={formData.firstName} onChange={e => handleChange('firstName', e.target.value)} />
            <Input placeholder='Last Name' value={formData.lastName} onChange={e => handleChange('lastName', e.target.value)} />
            <Input placeholder='Email' value={formData.email} onChange={e => handleChange('email', e.target.value)} />
            <Input placeholder='Phone' value={formData.phone} onChange={e => handleChange('phone', e.target.value)} />
          </div>
          <TextArea placeholder='Bio' value={formData.bio} onChange={e => handleChange('bio', e.target.value)} rows={3} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Company Information</CardTitle></CardHeader>
        <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Input placeholder='Company' value={formData.company} onChange={e => handleChange('company', e.target.value)} />
          <Input placeholder='Position' value={formData.position} onChange={e => handleChange('position', e.target.value)} />
          <Input placeholder='Website' value={formData.website} onChange={e => handleChange('website', e.target.value)} />
          <Input placeholder='LinkedIn' value={formData.linkedin} onChange={e => handleChange('linkedin', e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Address Information</CardTitle></CardHeader>
        <CardContent className='space-y-4'>
          <Input placeholder='Address' value={formData.address} onChange={e => handleChange('address', e.target.value)} />
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Input placeholder='City' value={formData.city} onChange={e => handleChange('city', e.target.value)} />
            <Input placeholder='Province' value={formData.province} onChange={e => handleChange('province', e.target.value)} />
            <Input placeholder='Postal Code' value={formData.postalCode} onChange={e => handleChange('postalCode', e.target.value)} />
          </div>
          <Select value={formData.country} onValueChange={value => handleChange('country', value)}>
            <SelectTrigger><SelectValue placeholder='Country' /></SelectTrigger>
            <SelectContent>
              <SelectItem value='South Africa'>South Africa</SelectItem>
              <SelectItem value='Zimbabwe'>Zimbabwe</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
        <CardContent className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <Select value={formData.timezone} onValueChange={value => handleChange('timezone', value)}>
            <SelectTrigger><SelectValue placeholder='Timezone' /></SelectTrigger>
            <SelectContent>
              <SelectItem value='Africa/Johannesburg'>Africa/Johannesburg</SelectItem>
              <SelectItem value='Europe/London'>Europe/London</SelectItem>
            </SelectContent>
          </Select>
          <Select value={formData.language} onValueChange={value => handleChange('language', value)}>
            <SelectTrigger><SelectValue placeholder='Language' /></SelectTrigger>
            <SelectContent>
              <SelectItem value='English'>English</SelectItem>
              <SelectItem value='Zulu'>Zulu</SelectItem>
            </SelectContent>
          </Select>
          <Select value={formData.currency} onValueChange={value => handleChange('currency', value)}>
            <SelectTrigger><SelectValue placeholder='Currency' /></SelectTrigger>
            <SelectContent>
              <SelectItem value='ZAR'>ZAR (Rand)</SelectItem>
              <SelectItem value='USD'>USD (Dollar)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      <div className='space-y-2 pt-4'>
  <label className='flex items-center gap-2'>
    <input
      type='checkbox'
      checked={changePassword}
      onChange={e => setChangePassword(e.target.checked)}
    />
    Change Password
  </label>
  {changePassword && (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
      <Input.Password
        placeholder='New Password'
        value={newPassword}
        onChange={e => setNewPassword(e.target.value)}
      />
      <Input.Password
        placeholder='Confirm Password'
        value={confirmPassword}
        onChange={e => setConfirmPassword(e.target.value)}
      />
    </div>
  )}
</div>

      <div className='flex justify-end'>
        <Button onClick={handleSave} disabled={!isAuthenticated}>
          <Save className='h-4 w-4 mr-2' /> Save Profile
        </Button>
      </div>
    </div>
  );
}
