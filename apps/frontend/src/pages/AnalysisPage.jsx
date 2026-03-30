import ResultSummary from "../components/result/ResultSummary";
import DetailResultList from "../components/result/DetailResultList";
import GradCamViewer from "../components/result/GradCamViewer";
import InfoSection from "../components/result/InfoSection";

function AnalysisPage({ analysisStatus, result, error }) {
    if (analysisStatus === "loading") {
        return (
        <section className="state-card">
            <h2>분석 결과를 불러오는 중입니다...</h2>
            <p>잠시만 기다려 주세요.</p>
        </section>
        );
    }

    if (analysisStatus === "error") {
        return (
        <section className="state-card error-card">
            <h2>오류가 발생했습니다</h2>
            <p>{error}</p>
        </section>
        );
    }

    if (analysisStatus === "completed" && result) {
        return (
        <>
            <ResultSummary result={result} />
            <DetailResultList details={result.details} />
            <GradCamViewer result={result} />
            <InfoSection />
        </>
        );
    }

    return null;
    }

export default AnalysisPage;