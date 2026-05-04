import { GoogleLogin } from '@react-oauth/google';
import { motion } from 'motion/react';
import { ArrowRightLeft, Lock, ShieldCheck, Mail } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (credential: string) => void;
  error?: string | null;
}

export function LoginPage({ onLoginSuccess, error }: LoginPageProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-50/50 rounded-full blur-3xl" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 md:p-12 relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200 mb-6">
            <ArrowRightLeft className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Welcome Back</h1>
          <p className="text-slate-500 font-medium max-w-[280px]">
            Please sign in with your <span className="text-blue-600 font-bold">@jnpmedi.com</span> account to continue.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center min-h-[50px]">
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                if (credentialResponse.credential) {
                  onLoginSuccess(credentialResponse.credential);
                }
              }}
              onError={() => {
                console.log('Login Failed');
              }}
              useOneTap
              shape="pill"
              theme="outline"
              size="large"
              width="100%"
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3"
            >
              <Lock className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-700">Access Denied</p>
                <p className="text-xs text-red-600/80 leading-relaxed">{error}</p>
              </div>
            </motion.div>
          )}

          <div className="pt-6 border-t border-slate-100 mt-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-slate-400">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Enterprise Secure</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 justify-end">
                <Mail className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Restricted Domain</span>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-12 text-center text-[11px] text-slate-400 font-medium">
          Authorized personnel only. All access is logged and monitored.
        </p>
      </motion.div>
    </div>
  );
}
