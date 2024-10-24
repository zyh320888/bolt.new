import React, { useState, useRef } from 'react';
import { useAuth } from '~/hooks/useAuth';
import type { RegisterResponse } from '~/routes/api.auth.register';
import { uploadToOSS } from '~/utils/uploadToOSS';

interface RegisterProps {
  onClose: () => void;
  onRegisterSuccess: () => void;
}

export function Register({ onClose, onRegisterSuccess }: RegisterProps) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { login } = useAuth();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      setIsLoading(false);
      return;
    }
    if (!avatar) {
      setError('请上传头像');
      setIsLoading(false);
      return;
    }

    try {
      const avatarUrl = await uploadToOSS(avatar);

      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          password,
          nickname,
          avatarUrl,
        }),
      });

      const data = await registerResponse.json() as RegisterResponse;
      if (registerResponse.ok && data.token && data.user) {
        login(data.token, data.user);
        onClose(); // 关闭注册窗口
        onRegisterSuccess(); // 调用注册成功的回调
      } else {
        setError(data.error || '注册失败，请稍后再试');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      setError('注册失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-bolt-elements-textPrimary">
          手机号
        </label>
        <input
          type="tel"
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-md shadow-sm focus:outline-none focus:ring-bolt-elements-button-primary-background focus:border-bolt-elements-button-primary-background"
        />
      </div>
      <div>
        <label htmlFor="nickname" className="block text-sm font-medium text-bolt-elements-textPrimary">
          昵称
        </label>
        <input
          type="text"
          id="nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-md shadow-sm focus:outline-none focus:ring-bolt-elements-button-primary-background focus:border-bolt-elements-button-primary-background"
        />
      </div>
      <div>
        <label htmlFor="avatar" className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
          头像
        </label>
        <div className="flex items-center space-x-4">
          <div className="w-24 h-24 border-2 border-dashed border-bolt-elements-borderColor rounded-full flex items-center justify-center overflow-hidden">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-bolt-elements-textSecondary">No image</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-bolt-elements-button-secondary-background text-bolt-elements-button-secondary-text rounded-md hover:bg-bolt-elements-button-secondary-backgroundHover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bolt-elements-button-secondary-background"
          >
            选择头像
          </button>
          <input
            ref={fileInputRef}
            type="file"
            id="avatar"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-bolt-elements-textPrimary">
          密码
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-md shadow-sm focus:outline-none focus:ring-bolt-elements-button-primary-background focus:border-bolt-elements-button-primary-background"
        />
      </div>
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-bolt-elements-textPrimary">
          确认密码
        </label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-md shadow-sm focus:outline-none focus:ring-bolt-elements-button-primary-background focus:border-bolt-elements-button-primary-background"
        />
      </div>
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-bolt-elements-button-primary-text bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bolt-elements-button-primary-background ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? '注册中...' : '注册'}
        </button>
      </div>
    </form>
  );
}
