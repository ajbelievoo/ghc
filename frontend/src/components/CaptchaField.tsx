"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { api } from "@/lib/api";

export interface CaptchaValue {
  captchaId: string;
  captchaAnswer: string;
}

export function useCaptcha() {
  const [captcha, setCaptcha] = useState<CaptchaValue>({ captchaId: "", captchaAnswer: "" });
  const [image, setImage] = useState("");

  const refresh = useCallback(async () => {
    try {
      const res = await api.auth.captcha();
      setCaptcha((c) => ({ ...c, captchaId: res.captchaId, captchaAnswer: "" }));
      setImage(res.image);
    } catch {
      setImage("");
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { captcha, setCaptcha, image, refresh };
}

export function CaptchaField({ captcha, image, onChange, onRefresh }: {
  captcha: CaptchaValue;
  image: string;
  onChange: (v: CaptchaValue) => void;
  onRefresh: () => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="h-[52px] w-[150px] rounded-[10px] border border-slate-200 bg-slate-800 overflow-hidden flex-shrink-0">
          {image && <img src={image} alt="CAPTCHA" className="h-full w-full object-cover" />}
        </div>
        <button type="button" onClick={onRefresh} aria-label="New CAPTCHA"
          className="h-[52px] w-[42px] rounded-[10px] border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 hover:text-[#00b7ff] transition">
          <RefreshCw className="w-4 h-4" />
        </button>
        <input
          type="text" inputMode="numeric" autoComplete="off" required
          value={captcha.captchaAnswer}
          onChange={(e) => onChange({ ...captcha, captchaAnswer: e.target.value })}
          placeholder="Answer"
          className="flex-1 rounded-[10px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#00b7ff] focus:ring-[#00b7ff]/20 focus:ring-1 outline-none transition"
        />
      </div>
      <p className="mt-1 text-[11px] text-slate-400">Solve the math shown in the image</p>
    </div>
  );
}
