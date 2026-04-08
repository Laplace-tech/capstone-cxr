import { useState } from "react";
import { Stethoscope, Eye, EyeOff, LogIn } from "lucide-react";

export default function LoginPage({ onLogin, onGoSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      // TODO: 실제 로그인 API 연결
      // const response = await axiosClient.post("/auth/login", { email, password, autoLogin });
      // onLogin(response.data);
      await new Promise((res) => setTimeout(res, 800));
      onLogin({ email });
    } catch {
      setError("이메일 또는 비밀번호가 올바르지 않아요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f0f4ff 0%, #f4f7fb 60%, #e8f4f8 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "420px",
        background: "white",
        borderRadius: "24px",
        boxShadow: "0 8px 40px rgba(37,99,235,0.10)",
        padding: "48px 40px",
      }}>

        {/* 로고 */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "64px",
            height: "64px",
            borderRadius: "18px",
            background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
            marginBottom: "16px",
            boxShadow: "0 4px 16px rgba(37,99,235,0.3)",
          }}>
            <Stethoscope style={{ width: 32, height: 32, color: "white" }} />
          </div>
          <h1 style={{ margin: "0 0 6px 0", fontSize: "24px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.5px" }}>
            CXR Insight
          </h1>
          <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8", fontWeight: 500 }}>
            흉부 X-ray AI 판독 보조 시스템
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

          {/* 이메일 */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@hospital.com"
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "10px",
                border: "1.5px solid #e2e8f0",
                fontSize: "14px",
                color: "#1e293b",
                outline: "none",
                boxSizing: "border-box",
                background: "#f8fafc",
              }}
              onFocus={(e) => { e.target.style.borderColor = "#2563eb"; e.target.style.background = "white"; }}
              onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; }}
            />
          </div>

          {/* 비밀번호 */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
              비밀번호
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                style={{
                  width: "100%",
                  padding: "11px 42px 11px 14px",
                  borderRadius: "10px",
                  border: "1.5px solid #e2e8f0",
                  fontSize: "14px",
                  color: "#1e293b",
                  outline: "none",
                  boxSizing: "border-box",
                  background: "#f8fafc",
                }}
                onFocus={(e) => { e.target.style.borderColor = "#2563eb"; e.target.style.background = "white"; }}
                onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute", right: "12px", top: "50%",
                  transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "#94a3b8", padding: 0, display: "flex",
                }}
              >
                {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
              </button>
            </div>
          </div>

          {/* 자동 로그인 */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              id="auto-login"
              checked={autoLogin}
              onChange={(e) => setAutoLogin(e.target.checked)}
              style={{ width: 15, height: 15, accentColor: "#2563eb", cursor: "pointer" }}
            />
            <label htmlFor="auto-login" style={{ fontSize: "13px", color: "#64748b", cursor: "pointer" }}>
              자동 로그인
            </label>
          </div>

          {/* 에러 */}
          {error && (
            <p style={{ margin: 0, fontSize: "12px", color: "#ef4444" }}>⚠ {error}</p>
          )}

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "4px",
              width: "100%",
              padding: "13px",
              borderRadius: "10px",
              background: loading ? "#93c5fd" : "#2563eb",
              color: "white",
              fontSize: "14px",
              fontWeight: 600,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: loading ? "none" : "0 2px 12px rgba(37,99,235,0.25)",
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width: 16, height: 16,
                  border: "2px solid white",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  display: "inline-block",
                  animation: "spin 0.7s linear infinite",
                }} />
                로그인 중...
              </>
            ) : (
              <>
                <LogIn style={{ width: 16, height: 16 }} />
                로그인
              </>
            )}
          </button>
        </form>

        {/* 회원가입 링크 */}
        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
            계정이 없으신가요?{" "}
            <span
              onClick={() => onGoSignup && onGoSignup()}
              style={{ color: "#2563eb", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
            >
              회원가입
            </span>
          </p>
        </div>

        <p style={{ marginTop: "20px", textAlign: "center", fontSize: "11px", color: "#e2e8f0" }}>
          capstone-cxr · 의료 AI 판독 보조 시스템
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}