// apps/frontend/src/components/result/InfoSection.jsx

function InfoSection() {
  return (
    <section className="info-card product-panel">
      <span className="eyebrow">Clinical Safety Notice</span>
      <h2>판독 보조 사용 안내</h2>
      <div className="info-grid">
        <div>
          <h4>AI 결과의 의미</h4>
          <p>
            본 시스템은 흉부 X-ray에서 주요 이상 소견 가능성을 확률과 시각화로 제시하는 판독 보조 도구입니다.
            결과는 의료진의 최종 판독을 대체하지 않습니다.
          </p>
        </div>
        <div>
          <h4>Grad-CAM의 한계</h4>
          <p>
            Grad-CAM은 모델이 참고한 영역을 보여주지만, 병변의 정확한 경계나 병리학적 원인을 직접 증명하지는 않습니다.
          </p>
        </div>
        <div>
          <h4>권장 사용 방식</h4>
          <p>
            양성 소견, 확률, threshold, Grad-CAM 위치, 원본 영상을 함께 보고 판독 우선순위 설정과 재확인에 활용하는 것이 적절합니다.
          </p>
        </div>
      </div>
    </section>
  );
}

export default InfoSection;
