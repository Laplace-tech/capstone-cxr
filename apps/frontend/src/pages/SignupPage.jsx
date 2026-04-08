import { useState } from "react";
import { Stethoscope, Eye, EyeOff, ClipboardList } from "lucide-react";

const DEPARTMENTS = [
  "내과", "외과", "신경과", "신경외과", "영상의학과",
  "정형외과", "흉부외과", "응급의학과", "마취통증의학과", "기타",
];

export default function SingupPage({ onGoLogin }) {
  const [form, setForm] = useState({
    lastName: "",
    firstName: "",
    email: "",
    password: "",
    passwordConfirm: "",
    licenseNumber: "",
    hospital: "",
    department: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function validate() {
    if (!form.lastName || !form.firstName) return "이름을 입력해주세요.";
    if (!form.email) return "이메일을 입력해주세요.";
    if (!form.password || form.password.length < 8) return "비밀번호는 8자 이상이어야 해요.";
    if (form.password !== form.passwordConfirm) return "비밀번호가 일치하지 않아요.";
    if (!form.licenseNumber) return "의사 면허번호를 입력해주세요.";
    if (!form.hospital) return "소속 병원을 입력해주세요.";
    if (!form.department) return "진료과를 선택해주세요.";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError("");
    setLoading(true);
    try {
      // TODO: 실제 회원가입 API 연결
      // await fetch("/api/v1/auth/signup", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ ...form }),
      // });
      await new Promise((res) => setTimeout(res, 900));
      // 가입 신청 완료 → 승인 대기 안내 (부모에서 처리)
      onGoLogin("pending", form.email);
    } catch {
      setError("가입 신청 중 오류가 발생했어요. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  const inputBase = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "10px",
    border: "1.5px solid #e2e8f0",
    fontSize: "14px",
    color: "#1e293b",
    outline: "none",
    boxSizing: "border-box",
    background: "#f8fafc",
  };

  function focusStyle(e) {
    e.target.style.borderColor = "#2563eb";
    e.target.style.background = "white";
  }
  function blurStyle(e) {
    e.target.style.borderColor = "#e2e8f0";
    e.target.style.background = "#f8fafc";
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
        maxWidth: "480px",
        background: "white",
        borderRadius: "24px",
        boxShadow: "0 8px 40px rgba(37,99,235,0.10)",
        padding: "48px 40px",
      }}>

        {/* 로고 */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
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
          <h1 style={{ margin: "0 0 6px 0", fontSize: "22px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.5px" }}>
            의사 회원가입
          </h1>
          <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8", fontWeight: 500 }}>
            면허번호 입력 후 관리자 승인을 통해 서비스를 이용할 수 있어요
          </p>
        </div>

        {/* 승인 안내 배지 */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: "10px",
          padding: "10px 14px",
          marginBottom: "24px",
        }}>
          <ClipboardList style={{ width: 15, height: 15, color: "#2563eb", flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: "12px", color: "#1d4ed8", lineHeight: 1.5 }}>
            가입 신청 후 관리자 검토가 완료되면 이메일로 안내드려요. 승인까지 최대 1~2 영업일이 소요될 수 있어요.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0" }}>

          {/* 섹션: 기본 정보 */}
          <p style={{ margin: "0 0 12px 0", fontSize: "11px", fontWeight: 600, color: "#94a3b8", letterSpacing: "0.07em", textTransform: "uppercase" }}>
            기본 정보
          </p>

          {/* 이름 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>성</label>
              <input name="lastName" value={form.lastName} onChange={handleChange}
                type="text" placeholder="홍" style={inputBase} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>이름</label>
              <input name="firstName" value={form.firstName} onChange={handleChange}
                type="text" placeholder="길동" style={inputBase} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
          </div>

          {/* 이메일 */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>이메일</label>
            <input name="email" value={form.email} onChange={handleChange}
              type="email" placeholder="doctor@hospital.com" style={inputBase} onFocus={focusStyle} onBlur={blurStyle} />
          </div>

          {/* 비밀번호 */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>비밀번호</label>
            <div style={{ position: "relative" }}>
              <input name="password" value={form.password} onChange={handleChange}
                type={showPassword ? "text" : "password"} placeholder="8자 이상"
                style={{ ...inputBase, padding: "11px 42px 11px 14px" }}
                onFocus={focusStyle} onBlur={blurStyle} />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, display: "flex" }}>
                {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
              </button>
            </div>
          </div>

          {/* 비밀번호 확인 */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>비밀번호 확인</label>
            <div style={{ position: "relative" }}>
              <input name="passwordConfirm" value={form.passwordConfirm} onChange={handleChange}
                type={showPasswordConfirm ? "text" : "password"} placeholder="비밀번호 재입력"
                style={{ ...inputBase, padding: "11px 42px 11px 14px" }}
                onFocus={focusStyle} onBlur={blurStyle} />
              <button type="button" onClick={() => setShowPasswordConfirm((v) => !v)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, display: "flex" }}>
                {showPasswordConfirm ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
              </button>
            </div>
          </div>

          {/* 구분선 */}
          <div style={{ borderTop: "1px solid #f1f5f9", marginBottom: "20px" }} />

          {/* 섹션: 의사 인증 */}
          <p style={{ margin: "0 0 12px 0", fontSize: "11px", fontWeight: 600, color: "#94a3b8", letterSpacing: "0.07em", textTransform: "uppercase" }}>
            의사 인증
          </p>

          {/* 면허번호 */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>의사 면허번호</label>
            <input name="licenseNumber" value={form.licenseNumber} onChange={handleChange}
              type="text" placeholder="예: 12345"
              style={inputBase} onFocus={focusStyle} onBlur={blurStyle} />
            <p style={{ margin: "5px 0 0 2px", fontSize: "12px", color: "#94a3b8" }}>
              보건복지부 발급 의사 면허번호를 입력해 주세요
            </p>
          </div>

          {/* 소속 병원 */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>소속 병원 / 기관</label>
            <input name="hospital" value={form.hospital} onChange={handleChange}
              type="text" placeholder="예: 서울대학교병원"
              style={inputBase} onFocus={focusStyle} onBlur={blurStyle} />
          </div>

          {/* 진료과 */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>전문 진료과</label>
            <select name="department" value={form.department} onChange={handleChange}
              style={{ ...inputBase, color: form.department ? "#1e293b" : "#94a3b8", cursor: "pointer" }}
              onFocus={focusStyle} onBlur={blurStyle}>
              <option value="" disabled>선택해주세요</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* 에러 */}
          {error && (
            <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: "#ef4444" }}>⚠ {error}</p>
          )}

          {/* 제출 버튼 */}
          <button type="submit" disabled={loading} style={{
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
          }}>
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
                신청 중...
              </>
            ) : "가입 신청하기"}
          </button>
        </form>

        {/* 로그인 링크 */}
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
            이미 계정이 있으신가요?{" "}
            <span onClick={() => onGoLogin && onGoLogin()}
              style={{ color: "#2563eb", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>
              로그인
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