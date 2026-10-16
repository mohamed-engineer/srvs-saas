"use client";

import Link from "next/link";
import { FormEvent,useEffect,useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight,Eye,EyeOff,LockKeyhole,Mail,UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

function safeNext(value: string | null) { return value?.startsWith("/") && !value.startsWith("//") ? value : "/profile"; }

export default function LoginPage(){
 const router=useRouter(); const [mode,setMode]=useState<"login"|"signup">("login"); const [next,setNext]=useState("/profile");
 const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [showPassword,setShowPassword]=useState(false);
 const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [message,setMessage]=useState("");
 useEffect(()=>{const params=new URLSearchParams(window.location.search);setNext(safeNext(params.get("next")));if(params.get("mode")==="signup")setMode("signup");if(params.get("setup"))setError("أضف إعدادات Supabase إلى ملف .env.local ثم أعد تشغيل الموقع.")},[]);
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setError("");setMessage("");setBusy(true);try{
   const supabase=createClient();
   if(mode==="login"){
    const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});if(error)throw error;router.replace(next);router.refresh();
   }else{
    const {data,error}=await supabase.auth.signUp({email:email.trim(),password,options:{data:{full_name:name.trim()},emailRedirectTo:`${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`}});if(error)throw error;
    if(data.session){router.replace(next);router.refresh()}else setMessage("بعتنالك رسالة تأكيد على بريدك. أكد البريد وبعدها سجّل الدخول.");
   }
  }catch(e){setError(e instanceof Error?e.message:"حصل خطأ، حاول مرة تانية.")}finally{setBusy(false)}}
 return <main className="auth-page" dir="rtl"><header className="auth-nav"><Link href="/" className="marketing-brand"><span className="brand-symbol">S</span><span>SRVS<small>ACCOUNTING</small></span></Link><Link href="/" className="back-home"><ArrowRight size={14}/> الرئيسية</Link></header><section className="auth-card"><div className="auth-mark"><LockKeyhole size={19}/></div><span className="section-label">مساحة آمنة لنشاطك</span><h1>{mode==="login"?"أهلاً بعودتك":"أنشئ حسابك"}</h1><p>{mode==="login"?"سجل الدخول لمتابعة نظامك المحاسبي.":"حساب واحد لإدارة نشاطك على SRVS Accounting."}</p>
  {!hasSupabasePublicEnv()&&<div className="auth-config">قاعدة البيانات غير مربوطة بعد. ضع مفاتيح Supabase في <code>.env.local</code> ثم أعد تشغيل التطبيق.</div>}
  <form onSubmit={submit}>
   {mode==="signup"&&<label className="auth-field"><span>الاسم بالكامل</span><div><UserRound size={16}/><input value={name} onChange={e=>setName(e.target.value)} autoComplete="name" required minLength={2} placeholder="اسمك"/></div></label>}
   <label className="auth-field"><span>البريد الإلكتروني</span><div><Mail size={16}/><input value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" type="email" required placeholder="you@example.com" dir="ltr"/></div></label>
   <label className="auth-field"><span>كلمة المرور</span><div><LockKeyhole size={16}/><input value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==="login"?"current-password":"new-password"} type={showPassword?"text":"password"} minLength={8} required placeholder="٨ أحرف على الأقل"/><button type="button" aria-label="إظهار كلمة المرور" onClick={()=>setShowPassword(!showPassword)}>{showPassword?<EyeOff size={15}/>:<Eye size={15}/>}</button></div></label>
   {error&&<p className="auth-error" role="alert">{error}</p>}{message&&<p className="auth-message" role="status">{message}</p>}
   <button className="cta-primary auth-submit" disabled={busy||!hasSupabasePublicEnv()}>{busy?"لحظة واحدة...":mode==="login"?"تسجيل الدخول":"إنشاء الحساب"}<ArrowRight size={15}/></button>
  </form><div className="auth-switch">{mode==="login"?"لسه ما عندكش حساب؟":"عندك حساب بالفعل؟"}<button onClick={()=>{setMode(mode==="login"?"signup":"login");setError("");setMessage("")}}>{mode==="login"?"أنشئ حساباً":"سجّل الدخول"}</button></div><div className="auth-footer">بياناتك محمية ومخصصة لحسابك</div></section><footer className="auth-bottom">© 2026 SRVS Digital</footer></main>
}
