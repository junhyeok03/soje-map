import { withBasePath } from "./site-config";

export type Era = "past" | "present" | "future";

export type EraPhoto = {
  src: string;
  alt: string;
  capturedAt: string;
  credit: string;
  kind: "archive" | "ai";
  sourceUrl?: string;
  usageNote: string;
};

export type EraContent = {
  year: string;
  title: string;
  description: string;
  imageLabel: string;
  photo?: EraPhoto;
};

export type SojeLocation = {
  id: string;
  order: number;
  name: string;
  shortName: string;
  category: string;
  address: string;
  coordinates: [number, number];
  walkMinutes: number;
  summary: string;
  eras: Record<Era, EraContent>;
};

export const ERA_LABELS: Record<Era, string> = {
  past: "과거",
  present: "현재",
  future: "미래",
};

const DAEJEON_ARCHIVE = {
  credit: "대전광역시 사진 아카이브",
  kind: "archive" as const,
  usageNote: "워터마크 사진 · 출처 표기 · 비상업 사용",
};

const AI_PAST = {
  credit: "AI 복원 상상도",
  kind: "ai" as const,
  usageNote: "AI 생성 · 역사적 사실 사진 아님",
};

const AI_FUTURE = {
  credit: "AI 미래 비전",
  kind: "ai" as const,
  usageNote: "AI 생성 · 확정 계획 아님",
};

export const SOJE_LOCATIONS: SojeLocation[] = [
  {
    id: "traditional-narae-hall",
    order: 1,
    name: "대전전통나래관",
    shortName: "전통나래관",
    category: "전통문화 거점",
    address: "대전 동구 철갑2길 2",
    coordinates: [36.3349726, 127.4373939],
    walkMinutes: 0,
    summary:
      "대전의 무형유산을 전시와 교육으로 소개하는 복합문화공간입니다. 소제동 기억 산책의 시작점으로 삼았습니다.",
    eras: {
      past: {
        year: "1920년대 상상",
        title: "소제호 주변에 마을이 있던 풍경",
        description:
          "옛 소제호 주변의 생활 환경을 참고해 이 자리의 이전 모습을 발표용으로 상상한 장면입니다.",
        imageLabel: "대전전통나래관 자리의 과거 상상 이미지",
        photo: {
          ...AI_PAST,
          src: withBasePath(
            "/locations/generated/traditional-narae-hall-past-ai.jpg",
          ),
          alt: "1920년대 소제호 주변 마을을 흑백 기록 사진처럼 상상한 AI 이미지",
          capturedAt: "1920년대 추정 장면",
        },
      },
      present: {
        year: "2026년",
        title: "무형유산을 만나는 열린 전시관",
        description:
          "기능 종목을 중심으로 전시와 교육을 운영하며 지역의 전통문화와 방문객을 연결합니다.",
        imageLabel: "대전전통나래관 현재 사진",
        photo: {
          ...DAEJEON_ARCHIVE,
          src: withBasePath("/locations/traditional-narae-hall.jpg"),
          alt: "맑은 하늘 아래 대전전통나래관 건물 전경",
          capturedAt: "2026.01.08 촬영",
          sourceUrl:
            "https://photo.daejeon.go.kr/prog/photodb/dataList.do?searchCondition=all&searchKeyword=%EB%8C%80%EC%A0%84%EC%A0%84%ED%86%B5%EB%82%98%EB%9E%98%EA%B4%80",
        },
      },
      future: {
        year: "2035년 비전",
        title: "동네 기록으로 확장되는 문화 거점",
        description:
          "전시 관람 뒤 소제동의 골목 기록까지 이어서 탐색할 수 있는 오프라인·디지털 연계 거점을 제안합니다.",
        imageLabel: "대전전통나래관의 미래 비전 이미지",
        photo: {
          ...AI_FUTURE,
          src: withBasePath(
            "/locations/generated/traditional-narae-hall-future-ai.jpg",
          ),
          alt: "그늘과 무장애 보행 공간이 더해진 2035년 전통문화 거점을 상상한 AI 이미지",
          capturedAt: "2035년 제안 장면",
        },
      },
    },
  },
  {
    id: "cheolgap-bridge",
    order: 2,
    name: "철갑교",
    shortName: "철갑교",
    category: "수변 연결점",
    address: "대전 동구 철갑길 · 대동천",
    coordinates: [36.3350612, 127.4382398],
    walkMinutes: 2,
    summary:
      "철갑길과 대동천을 잇는 실제 교량입니다. 골목의 밀도에서 수변의 열린 풍경으로 시야가 바뀌는 지점입니다.",
    eras: {
      past: {
        year: "1930년대 상상",
        title: "자연 하천과 작은 나무다리",
        description:
          "대동천 정비 이전의 자연스러운 물길과 작은 보행 다리가 있었을 법한 모습을 상상해 재구성했습니다.",
        imageLabel: "철갑교 주변의 과거 상상 이미지",
        photo: {
          ...AI_PAST,
          src: withBasePath("/locations/generated/cheolgap-bridge-past-ai.jpg"),
          alt: "1930년대 자연 하천과 작은 나무다리를 흑백 기록 사진처럼 상상한 AI 이미지",
          capturedAt: "1930년대 추정 장면",
        },
      },
      present: {
        year: "2026년",
        title: "골목과 대동천을 잇는 작은 다리",
        description:
          "철갑교를 건너면 소제동 골목과 대동천 산책로를 한 동선으로 경험할 수 있습니다.",
        imageLabel: "철갑교 인근 대동천 현재 사진",
        photo: {
          ...DAEJEON_ARCHIVE,
          src: withBasePath("/locations/cheolgap-bridge.jpg"),
          alt: "벚꽃이 핀 대동천 산책로와 교량 인근 풍경",
          capturedAt: "2026.04.02 촬영",
          sourceUrl:
            "https://photo.daejeon.go.kr/prog/photodb/dataList.do?searchCondition=all&searchKeyword=%EC%86%8C%EC%A0%9C%EB%8F%99+%EB%B2%9A%EA%BD%83",
        },
      },
      future: {
        year: "2035년 비전",
        title: "시간 산책의 방향을 알려주는 관문",
        description:
          "교량 난간과 진입부에 절제된 안내 체계를 더해 골목과 수변의 다음 이야기를 자연스럽게 연결합니다.",
        imageLabel: "철갑교의 미래 연결 지점 이미지",
        photo: {
          ...AI_FUTURE,
          src: withBasePath(
            "/locations/generated/cheolgap-bridge-future-ai.jpg",
          ),
          alt: "복원된 수변과 보행 중심 다리가 연결된 2035년 철갑교를 상상한 AI 이미지",
          capturedAt: "2035년 제안 장면",
        },
      },
    },
  },
  {
    id: "soje-creative-village",
    order: 3,
    name: "소제창작촌",
    shortName: "소제창작촌",
    category: "예술 재생 공간",
    address: "대전 동구 시울1길 1",
    coordinates: [36.336171, 127.4356553],
    walkMinutes: 7,
    summary:
      "철도 관사 공간을 바탕으로 예술가와 주민의 활동이 이어진 창작 공간입니다. 작은 간판과 오래된 건물의 표정을 그대로 만날 수 있습니다.",
    eras: {
      past: {
        year: "1960년대 상상",
        title: "생활과 일이 맞닿은 작은 공간",
        description:
          "창작 공간이 되기 전, 골목의 평범한 작업실과 생활 공간으로 쓰였을 법한 모습을 상상했습니다.",
        imageLabel: "소제창작촌 이전의 과거 상상 이미지",
        photo: {
          ...AI_PAST,
          src: withBasePath(
            "/locations/generated/soje-creative-village-past-ai.jpg",
          ),
          alt: "1960년대 철도 골목의 작은 작업실을 흑백 기록 사진처럼 상상한 AI 이미지",
          capturedAt: "1960년대 추정 장면",
        },
      },
      present: {
        year: "2024년 기록",
        title: "작업과 동네가 맞닿은 작은 창작촌",
        description:
          "옛 건물의 형태를 남긴 채 전시와 창작 활동을 담아 온 소제동의 대표적인 문화 재생 공간입니다.",
        imageLabel: "소제창작촌 현재 사진",
        photo: {
          ...DAEJEON_ARCHIVE,
          src: withBasePath("/locations/soje-creative-village.jpg"),
          alt: "낡은 미닫이문과 작은 간판이 남아 있는 소제창작촌 정면",
          capturedAt: "2024.08.05 촬영",
          sourceUrl:
            "https://photo.daejeon.go.kr/prog/photodb/dataList.do?searchCondition=all&searchKeyword=%EC%86%8C%EC%A0%9C%EB%8F%99+%EC%B0%BD%EC%9E%91%EC%B4%8C",
        },
      },
      future: {
        year: "2035년 비전",
        title: "작가와 주민의 기록이 쌓이는 공간",
        description:
          "행사 결과뿐 아니라 작업 과정과 주민의 목소리까지 축적해 골목에서 다시 꺼내 보는 작은 아카이브를 제안합니다.",
        imageLabel: "소제창작촌의 미래 비전 이미지",
        photo: {
          ...AI_FUTURE,
          src: withBasePath(
            "/locations/generated/soje-creative-village-future-ai.jpg",
          ),
          alt: "옛 건물의 표정을 보존한 2035년 동네 창작 공간을 상상한 AI 이미지",
          capturedAt: "2035년 제안 장면",
        },
      },
    },
  },
  {
    id: "railway-residence-village",
    order: 4,
    name: "소제동 철도관사촌",
    shortName: "철도관사촌",
    category: "근대 생활 유산",
    address: "대표 지점: 관사17호 · 대전 동구 수향1길 4",
    coordinates: [36.3369934, 127.4363972],
    walkMinutes: 10,
    summary:
      "대전역 동쪽에 남은 철도 관사군입니다. 한 채가 아니라 골목과 집들이 모여 만든 생활 경관 전체를 하나의 장소로 보았습니다.",
    eras: {
      past: {
        year: "1930년대 상상",
        title: "철도 종사자들의 관사 마을",
        description:
          "대전역 동쪽에 낮은 관사와 좁은 골목이 모여 있던 초기 생활 경관을 기록 사진의 분위기로 상상했습니다.",
        imageLabel: "철도관사촌의 과거 상상 이미지",
        photo: {
          ...AI_PAST,
          src: withBasePath(
            "/locations/generated/railway-residence-village-past-ai.jpg",
          ),
          alt: "1930년대 낮은 철도 관사와 골목이 모인 마을을 상상한 흑백 AI 이미지",
          capturedAt: "1930년대 추정 장면",
        },
      },
      present: {
        year: "2024년 기록",
        title: "낮은 지붕과 골목이 남은 생활 경관",
        description:
          "관사와 증개축된 주택, 새로 들어선 공간이 나란히 놓여 소제동의 여러 시간이 한눈에 겹쳐 보입니다.",
        imageLabel: "철도관사촌 일대 현재 항공 사진",
        photo: {
          ...DAEJEON_ARCHIVE,
          src: withBasePath("/locations/railway-residence-village.jpg"),
          alt: "낮은 지붕의 집과 골목이 모여 있는 소제동 일대 항공 전경",
          capturedAt: "2024.05.08 촬영",
          sourceUrl:
            "https://photo.daejeon.go.kr/prog/photodb/dataList.do?searchCondition=all&searchKeyword=%EC%86%8C%EC%A0%9C%EB%8F%99",
        },
      },
      future: {
        year: "2035년 비전",
        title: "생활의 결을 보존하는 산책 구역",
        description:
          "개별 건물만 강조하지 않고 골목 폭, 지붕선, 주민 생활을 함께 존중하는 기록·안내 방식을 제안합니다.",
        imageLabel: "철도관사촌의 미래 비전 이미지",
        photo: {
          ...AI_FUTURE,
          src: withBasePath(
            "/locations/generated/railway-residence-village-future-ai.jpg",
          ),
          alt: "낮은 지붕선과 생활 골목을 보존한 2035년 철도관사촌을 상상한 AI 이미지",
          capturedAt: "2035년 제안 장면",
        },
      },
    },
  },
  {
    id: "pungryu-soje",
    order: 5,
    name: "풍류소제",
    shortName: "풍류소제",
    category: "관사 활용 공간",
    address: "대전 동구 수향길 31",
    coordinates: [36.3366658, 127.4369793],
    walkMinutes: 12,
    summary:
      "구 풍뉴가에서 현재 풍류소제로 이어진 대나무 정원의 공간입니다. 관사 활용과 상업 공간의 변화를 함께 살펴보는 지점입니다.",
    eras: {
      past: {
        year: "1970년대 상상",
        title: "주거 공간과 대나무 정원",
        description:
          "상업 공간으로 바뀌기 전 오래된 집과 자라기 시작한 대나무 마당의 일상적인 모습을 상상했습니다.",
        imageLabel: "풍류소제 활용 이전의 과거 상상 이미지",
        photo: {
          ...AI_PAST,
          src: withBasePath("/locations/generated/pungryu-soje-past-ai.jpg"),
          alt: "1970년대 오래된 주택과 대나무 마당을 빛바랜 사진처럼 상상한 AI 이미지",
          capturedAt: "1970년대 추정 장면",
        },
      },
      present: {
        year: "2024년 기록",
        title: "대나무와 오래된 집이 만드는 체류 공간",
        description:
          "울창한 대나무와 기존 건물의 분위기를 활용해 소제동 카페거리의 인상을 보여 주는 공간입니다.",
        imageLabel: "풍류소제 대나무 정원 현재 사진",
        photo: {
          ...DAEJEON_ARCHIVE,
          src: withBasePath("/locations/pungryu-soje.jpg"),
          alt: "오래된 집 옆으로 대나무가 빽빽하게 자란 풍류소제 정원",
          capturedAt: "2024.10.04 촬영",
          sourceUrl:
            "https://photo.daejeon.go.kr/prog/photodb/dataList.do?searchCondition=all&searchKeyword=%EC%86%8C%EC%A0%9C%EB%8F%99+%EC%B9%B4%ED%8E%98",
        },
      },
      future: {
        year: "2035년 비전",
        title: "상업과 장소 기억의 균형",
        description:
          "방문 경험과 함께 건물의 이전 쓰임, 주민의 기억, 리모델링 과정을 투명하게 보여 주는 해설을 제안합니다.",
        imageLabel: "풍류소제의 미래 활용 이미지",
        photo: {
          ...AI_FUTURE,
          src: withBasePath("/locations/generated/pungryu-soje-future-ai.jpg"),
          alt: "대나무와 기존 건물을 보존하며 작은 기록 전시가 더해진 2035년 풍류소제를 상상한 AI 이미지",
          capturedAt: "2035년 제안 장면",
        },
      },
    },
  },
  {
    id: "daedongcheon-cherry-road",
    order: 6,
    name: "대동천 소제동 벚꽃길",
    shortName: "대동천 벚꽃길",
    category: "수변 보행축",
    address: "대전 동구 소제동 대동천 구간",
    coordinates: [36.3382782, 127.4366237],
    walkMinutes: 16,
    summary:
      "소제동 동쪽을 따라 흐르는 대동천의 보행 구간입니다. 골목 탐방을 수변의 계절 풍경으로 마무리하는 지점입니다.",
    eras: {
      past: {
        year: "1950년대 상상",
        title: "마을 곁을 흐르던 자연스러운 물길",
        description:
          "제방과 산책로가 정비되기 전, 징검다리와 풀밭이 있던 생활 하천의 모습을 상상해 재구성했습니다.",
        imageLabel: "대동천의 과거 상상 이미지",
        photo: {
          ...AI_PAST,
          src: withBasePath(
            "/locations/generated/daedongcheon-cherry-road-past-ai.jpg",
          ),
          alt: "1950년대 자연 하천과 징검다리를 흑백 기록 사진처럼 상상한 AI 이미지",
          capturedAt: "1950년대 추정 장면",
        },
      },
      present: {
        year: "2026년",
        title: "봄의 풍경이 이어지는 수변 산책로",
        description:
          "산책로와 징검다리, 벚꽃이 이어져 골목과 다른 속도로 소제동을 바라볼 수 있습니다.",
        imageLabel: "대동천 벚꽃길 현재 사진",
        photo: {
          ...DAEJEON_ARCHIVE,
          src: withBasePath("/locations/daedongcheon-cherry-road.jpg"),
          alt: "벚꽃이 활짝 핀 대동천 양안과 산책하는 시민들",
          capturedAt: "2026.04.02 촬영",
          sourceUrl:
            "https://photo.daejeon.go.kr/prog/photodb/dataList.do?searchCondition=all&searchKeyword=%EC%86%8C%EC%A0%9C%EB%8F%99+%EB%B2%9A%EA%BD%83",
        },
      },
      future: {
        year: "2035년 비전",
        title: "골목과 물길을 잇는 느린 녹색축",
        description:
          "계절 그늘과 휴식 지점을 보강하고 골목 안내와 연결해 탐방의 시작과 끝을 품는 산책로를 제안합니다.",
        imageLabel: "대동천의 미래 수변 이미지",
        photo: {
          ...AI_FUTURE,
          src: withBasePath(
            "/locations/generated/daedongcheon-cherry-road-future-ai.jpg",
          ),
          alt: "풍부한 녹지와 무장애 산책로가 이어지는 2035년 대동천을 상상한 AI 이미지",
          capturedAt: "2035년 제안 장면",
        },
      },
    },
  },
];
