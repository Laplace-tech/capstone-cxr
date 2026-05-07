import { Stethoscope, Clock, Mail, CheckCircle } from "lucide-react";

const STEPS = [
  { icon: CheckCircle, label: "가입 신청 완료", done: true },
  { icon: Clock, label: "관리자 검토 중", done: false },
  { icon: Mail, label: "승인 이메일 수신", done: false },
];

export default function PendingPage({ email, onGoLogin }) {
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
        textAlign: "center",
      }}>

        {/* 로고 */}
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

        <h1 style={{ margin: "0 0 8px 0", fontSize: "22px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.5px" }}>
          신청이 완료됐어요
        </h1>
        <p style={{ margin: "0 0 32px 0", fontSize: "13px", color: "#94a3b8", lineHeight: 1.6 }}>
          관리자 검토 후 승인 결과를 이메일로 안내드릴게요.<br />
          최대 1~2 영업일이 소요될 수 있어요.
        </p>

        {/* 이메일 표시 */}
        {email && (
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "10px",
            padding: "9px 16px",
            marginBottom: "32px",
          }}>
            <Mail style={{ width: 14, height: 14, color: "#2563eb" }} />
            <span style={{ fontSize: "13px", color: "#1d4ed8", fontWeight: 500 }}>{email}</span>
          </div>
        )}

        {/* 진행 단계 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0", marginBottom: "36px", textAlign: "left" }}>
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: step.done ? "#2563eb" : "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Icon style={{ width: 15, height: 15, color: step.done ? "white" : "#94a3b8" }} />
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{
                      width: "1.5px",
                      height: "28px",
                      background: step.done ? "#bfdbfe" : "#e2e8f0",
                      margin: "4px 0",
                    }} />
                  )}
                </div>
                <div style={{ paddingTop: "6px" }}>
                  <p style={{
                    margin: 0,
                    fontSize: "13px",
                    fontWeight: step.done ? 600 : 400,
                    color: step.done ? "#1e293b" : "#94a3b8",
                  }}>
                    {step.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 로그인으로 */}
        <button
          onClick={() => onGoLogin && onGoLogin()}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: "10px",
            background: "white",
            color: "#2563eb",
            fontSize: "14px",
            fontWeight: 600,
            border: "1.5px solid #bfdbfe",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => { e.target.style.background = "#eff6ff"; }}
          onMouseLeave={(e) => { e.target.style.background = "white"; }}
        >
          로그인 화면으로 돌아가기
        </button>

        <p style={{ marginTop: "20px", fontSize: "11px", color: "#e2e8f0" }}>
          capstone-cxr · 의료 AI 판독 보조 시스템
        </p>
      </div>
    </div>
  );
}