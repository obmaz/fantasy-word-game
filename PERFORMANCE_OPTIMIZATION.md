# 게임 로딩 속도 최적화 가이드

## ✅ 적용 완료된 최적화

### 1. 음악 파일 최적화

-   ✅ `preload="none"` 추가: 초기 로딩 시 음악 파일을 로드하지 않음
-   **효과**: 약 1.9MB (1926.7 KB)의 초기 로딩 부하 제거

### 2. JavaScript 파일 최적화

-   ✅ `defer` 속성 추가: 모든 스크립트에 defer 적용
-   **효과**: HTML 파싱을 차단하지 않고 병렬 로딩

### 3. 이미지 최적화

-   ✅ 중요 이미지 `loading="eager"`: 타이틀 화면 배경 이미지
-   ✅ 중요 이미지 `preload`: 타이틀 배경 이미지 preload 추가
-   ✅ 버튼 이미지 `loading="lazy"`: 타이틀 화면 버튼들
-   ✅ 게임 내 이미지 `loading="lazy"`: 히어로, 몬스터, 모달 배경 등

### 4. CSS 최적화

-   ✅ Critical CSS preload: variables.css, title-screen.css

## 현재 문제점 분석

### 1. 리소스 로딩 최적화 필요 사항

#### 이미지 최적화

-   **WebP 형식 사용 중** ✅ (이미 최적화됨)
-   **이미지 크기 확인 필요**: 각 이미지 파일의 실제 크기를 확인하고 필요시 압축
-   **Lazy Loading 미적용**: 모든 이미지가 즉시 로드됨
-   **Preload 미적용**: 중요한 이미지에 대한 preload 태그 없음

#### 음악 파일 최적화

-   **MP3 형식**: `data/background_music.mp3` 파일 크기 확인 필요
-   **Ogg Vorbis 추가 고려**: 더 작은 파일 크기 가능
-   **Lazy Loading**: 게임 시작 시가 아닌 필요할 때 로드

#### JavaScript 파일 최적화

-   **모든 스크립트 동기 로드**: `app.js` (4610줄), `data-loader.js` 등
-   **데이터 파일**: `game-data-1.js`, `game-data-2.js` 크기 확인 필요
-   **Minification 미적용**: 개발용 코드 그대로 배포

## 최적화 방법

### 1. 이미지 최적화

#### A. 이미지 압축

```bash
# WebP 이미지 최적화 도구 사용
# cwebp 또는 imagemin-webp 사용
```

#### B. Lazy Loading 적용

```html
<!-- 중요하지 않은 이미지에 lazy loading -->
<img src="images/title/title_header_1.webp" loading="lazy" alt="Title Header" />

<!-- 배경 이미지는 CSS에서 처리 -->
```

#### C. Preload 중요 이미지

```html
<head>
    <!-- 타이틀 화면에 필요한 이미지 preload -->
    <link rel="preload" as="image" href="images/title/title.webp" />
    <link rel="preload" as="image" href="images/title/title_header_1.webp" />
</head>
```

### 2. 음악 파일 최적화

#### A. 파일 크기 최적화

-   **MP3 비트레이트 낮추기**: 128kbps 또는 96kbps로 낮추기
-   **Ogg Vorbis 형식 추가**: 더 작은 파일 크기
-   **게임 시작 시 로드하지 않기**: 필요할 때만 로드

```html
<!-- 현재 -->
<audio id="background-music" loop>
    <source src="data/background_music.mp3" type="audio/mpeg" />
</audio>

<!-- 개선안: preload="none" 추가 -->
<audio id="background-music" loop preload="none">
    <source src="data/background_music.mp3" type="audio/mpeg" />
    <source src="data/background_music.ogg" type="audio/ogg" />
</audio>
```

### 3. JavaScript 최적화

#### A. 스크립트 로딩 최적화

```html
<!-- 현재: 동기 로드 -->
<script src="data/game-data-1.js"></script>
<script src="data/game-data-2.js"></script>
<script src="scripts/app.js"></script>

<!-- 개선안: defer 사용 -->
<script src="data/game-data-1.js" defer></script>
<script src="data/game-data-2.js" defer></script>
<script src="scripts/app.js" defer></script>
```

#### B. 코드 분할 (Code Splitting)

-   게임 데이터를 별도 파일로 분리 (이미 분리됨 ✅)
-   필요시 동적 import 사용

#### C. Minification

```bash
# 프로덕션 빌드 시 minification 적용
# terser 또는 esbuild 사용
```

### 4. CSS 최적화

#### A. Critical CSS 인라인

-   초기 렌더링에 필요한 CSS만 인라인
-   나머지는 비동기 로드

#### B. CSS 파일 통합

-   작은 CSS 파일들을 하나로 통합하여 HTTP 요청 감소

### 5. 리소스 우선순위 설정

```html
<head>
    <!-- Critical 리소스 preload -->
    <link rel="preload" as="style" href="styles/variables.css" />
    <link rel="preload" as="style" href="styles/title-screen.css" />

    <!-- 중요 이미지 preload -->
    <link rel="preload" as="image" href="images/title/title.webp" />
</head>
```

### 6. 브라우저 캐싱 활용

```html
<!-- Service Worker 또는 HTTP 헤더로 캐싱 설정 -->
<!-- 이미 로드된 리소스는 캐시에서 가져오기 -->
```

## 추가 최적화 가능한 사항

### 1. 음악 파일 압축 (권장)

-   **현재**: background_music.mp3 (1926.7 KB)
-   **목표**: 128kbps 또는 96kbps로 재인코딩하여 500-800KB로 축소
-   **도구**: Audacity, FFmpeg 등 사용

```bash
# FFmpeg 예시
ffmpeg -i background_music.mp3 -b:a 128k background_music_128k.mp3
```

### 2. 이미지 추가 압축 (선택사항)

-   WebP 이미지 재압축으로 추가 10-20% 크기 감소 가능
-   **도구**: cwebp, imagemin-webp

### 3. JavaScript Minification (프로덕션 빌드)

-   개발용 코드를 minify하여 파일 크기 감소
-   **도구**: terser, esbuild

### 4. Service Worker 캐싱 (고급)

-   한 번 로드된 리소스를 캐시하여 재방문 시 빠른 로딩

## 파일 크기 확인 방법

```powershell
# 이미지 파일 크기 확인
Get-ChildItem -Path 'images' -Recurse -File | Select-Object FullName, @{Name='Size(KB)';Expression={[math]::Round($_.Length/1KB,2)}}

# 데이터 파일 크기 확인
Get-ChildItem -Path 'data' -File | Select-Object FullName, @{Name='Size(KB)';Expression={[math]::Round($_.Length/1KB,2)}}
```

## 예상 효과

-   **초기 로딩 시간**: 30-50% 감소 예상
-   **첫 화면 표시 시간**: 20-40% 개선 예상
-   **전체 리소스 로딩**: Lazy loading으로 필요 시에만 로드하여 초기 부하 감소
