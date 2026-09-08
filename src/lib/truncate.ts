/**
 * 목록/캘린더 미리보기용 "요약" 표시 로직.
 * 별도 BE API가 아니라 순수 FE 표시 규칙이다 (docs/API_SPEC.md, docs/ISSUE-여행기록-구현.md 참고).
 * maxLength를 초과할 때만 잘라내고 끝에 '...'을 붙인다. 이내면 원문 그대로 반환한다.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}...`;
}

// 기록 제목 미리보기 글자 수.
export const RECORD_TITLE_PREVIEW_LENGTH = 10;

// 기록 내용 미리보기 글자 수: 사진이 있으면 32자, 없으면 46자.
export function recordContentPreviewLength(hasPhoto: boolean): number {
  return hasPhoto ? 32 : 46;
}
