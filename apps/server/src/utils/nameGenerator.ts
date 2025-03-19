/**
 * Nickname generator를 위한 데이터 배열
 */
const adjectives = [
  "행복한", "빛나는", "귀여운", "용감한", "똑똑한", "친절한", "부지런한", "재미있는",
  "활발한", "차분한", "우아한", "신비로운", "멋진", "즐거운", "날쌘", "현명한"
];

const colors = [
  "빨간", "파란", "초록", "노란", "보라", "주황", "분홍", "하얀", 
  "검은", "은색", "금색", "청록", "남색", "연두", "자주", "밤색"
];

const animals = [
  "판다", "코알라", "호랑이", "사자", "기린", "코끼리", "토끼", "거북이",
  "여우", "늑대", "곰", "펭귄", "고래", "돌고래", "사슴", "캥거루"
];

const plants = [
  "장미", "해바라기", "진달래", "벚꽃", "민들레", "국화", "튤립", "무궁화",
  "목련", "연꽃", "코스모스", "라일락", "수선화", "데이지", "유칼립투스", "호박"
];

/**
 * 랜덤 닉네임을 생성하는 함수
 * @returns {string} 형용사, 색상, 동물/식물을 조합한 랜덤 닉네임
 */
export function generateRandomNickname(): string {
  // 각 배열에서 랜덤 요소 선택
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  // 동물과 식물 중 랜덤하게 하나 선택
  const useAnimal = Math.random() > 0.5;
  const noun = useAnimal 
    ? animals[Math.floor(Math.random() * animals.length)]
    : plants[Math.floor(Math.random() * plants.length)];
    
  // 최종 닉네임 생성 (형용사 + 색상 + 명사)
  return `${adjective} ${color} ${noun}`;
} 