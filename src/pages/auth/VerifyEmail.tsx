import { useState, useEffect } from "react";
import { useNavigate, useLocation} from "react-router-dom";
import { Button, Card } from "pixel-retroui";
import { AuthBrand } from "../../components/AuthBrand";
import { useAuth } from "../../context/useAuth";
import { verifyEmail, resendVerification } from "../../api/auth";
import { toast } from "react-hot-toast";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

export function VerifyEmail() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Obtener el email del estado de navegación
  const email = location.state?.email || "";

  useDocumentTitle("Verificar Cuenta");

  useEffect(() => {
    // Si ya está autenticado, redirigir
    if (user) {
      navigate("/sessions", { replace: true });
    }
    // Si no hay email en el estado, redirigir a login
    else if (!email) {
      navigate("/login", { replace: true });
    }
  }, [user, email, navigate]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError(null);
    setLoading(true);
    try {
      const res = await verifyEmail(email, code);
      // Una vez verificado, el backend nos devuelve el token y el usuario
      login(res, res.token);
      toast.success("¡Cuenta verificada exitosamente!");
      navigate("/sessions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Código incorrecto");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (countdown > 0) return;
    
    try {
      const res = await resendVerification(email);
      toast.success(res.mensaje || "Nuevo código enviado");
      setCountdown(60);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al reenviar código");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F0E4CC",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
      }}
    >
      <div className="retro-auth-shell">
        <AuthBrand />

        <Card
          bg="#FBF3E3"
          textColor="#1A0F08"
          borderColor="#1A0F08"
          shadowColor="#1A0F08"
          style={{ padding: 0, overflow: "hidden", width: "100%" }}
        >
          <div className="retro-section-header">
            <h2 style={{ textAlign: "center", width: "100%" }}>
              VERIFICAR CUENTA
            </h2>
          </div>
          <div style={{ padding: "20px 20px 24px" }}>
            <p
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "0.85rem",
                color: "#7A4F2D",
                textAlign: "center",
                marginBottom: 20,
                lineHeight: 1.5,
              }}
            >
              Hemos enviado un código de 4 dígitos a:
              <br />
              <strong style={{ color: "#C9521A" }}>{email}</strong>
            </p>

            <form onSubmit={handleSubmit}>
              {error && (
                <div
                  className="retro-alert retro-alert-error"
                  style={{ marginBottom: 16 }}
                >
                  ⚠ {error}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                {[0, 1, 2, 3].map((i) => (
                  <input
                    key={i}
                    id={`code-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={code[i] || ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      const newCodeArray = code.split("");
                      newCodeArray[i] = val;
                      const newCode = newCodeArray.join("");
                      setCode(newCode);
                      // Auto-focus al siguiente
                      if (val && i < 3) {
                        document.getElementById(`code-${i + 1}`)?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      // Backspace regresa al anterior
                      if (e.key === "Backspace" && !code[i] && i > 0) {
                        document.getElementById(`code-${i - 1}`)?.focus();
                      }
                    }}
                    style={{
                      width: "56px",
                      height: "64px",
                      textAlign: "center",
                      fontSize: "1.8rem",
                      fontFamily: "'Press Start 2P', monospace",
                      border: "2px solid #1A0F08",
                      backgroundColor: "#FBF3E3",
                      color: "#1A0F08",
                      outline: "none",
                    }}
                  />
                ))}
              </div>

              {loading && (
                <div
                  style={{
                    marginBottom: 16,
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: "0.55rem",
                    color: "#C9521A",
                    textAlign: "center",
                  }}
                >
                  VERIFICANDO...
                </div>
              )}

              <Button
                type="submit"
                bg="#C9521A"
                textColor="#FFFDF7"
                shadow="#1A0F08"
                borderColor="#1A0F08"
                disabled={loading || code.length !== 4}
                style={{ width: "100%" }}
              >
                {loading ? "VALIDANDO..." : "VERIFICAR"}
              </Button>

              <div style={{ marginTop: 20, textAlign: "center" }}>
                <p
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "0.72rem",
                    color: "#7A4F2D",
                    marginBottom: 8,
                  }}
                >
                  ¿No recibiste el código?
                </p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={countdown > 0}
                  style={{
                    background: "none",
                    border: "none",
                    color: countdown > 0 ? "#A0A0A0" : "#C9521A",
                    fontWeight: 700,
                    cursor: countdown > 0 ? "not-allowed" : "pointer",
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "0.75rem",
                    textDecoration: countdown > 0 ? "none" : "underline",
                  }}
                >
                  {countdown > 0
                    ? `Reenviar en ${countdown}s`
                    : "Reenviar código de verificación"}
                </button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
