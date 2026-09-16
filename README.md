# Mattermost Ladder Game Plugin 🪜

[English](#english) | [한국어](#한국어)

---

<a name="english"></a>
## English

A rich-UI interactive **Ladder Game (Ghost Leg / Amidakuji / 사다리타기)** plugin for Mattermost. Pick lunch menus, decide who buys coffee, or assign team roles right inside your channel!

![Plugin Icon](assets/icon.svg)

### ✨ Features

- 🪜 **Channel Header Action**: Open the ladder game modal with a single click from the channel header.
- 👥 **Channel Member Auto-Discovery**: Automatically fetch channel members and add/remove participants with a single click.
- ⚡ **One-Click Quick Presets**:
  - ☕ **Buy Coffee** (1 Selected / Rest Pass)
  - 🍱 **Buy Lunch** (1 Selected / Rest Pass)
  - 🎉 **Win / Pass** (Customizable winners & passes)
  - 🥇 **Rank Ordering** (1st, 2nd, 3rd...)
- 🎨 **Interactive Ladder Animation**:
  - Click on any participant to trace their path with smooth, animated lines.
  - Unique distinct color highlight for each player.
  - "Show All Results" button to reveal all outcomes at once.
- 📢 **Direct Channel Announcement**:
  - Share neatly formatted Markdown result tables and winner summaries to the channel.
- ⌨️ **Slash Command Support**:
  - `/ladder` or `/사다리`: Launch the interactive modal directly.
  - `/ladder Lunch Bet : Alice, Bob, Charlie : Winner, Pass, Coffee`: Generate ladder and post results immediately.

### 🛠️ Prerequisites & Build

#### Prerequisites
- Go 1.20 or higher
- Node.js 18 or higher & npm

#### Build & Package
```bash
# Build server & webapp, package into .tar.gz bundle
make dist
```

The release bundle will be created at `dist/com.mattermost.ladder-game-0.1.0.tar.gz`.

### 🚀 Installation Guide

1. Log in to Mattermost with a **System Admin** account.
2. Navigate to **System Console** (from the top-left main menu).
3. Go to **Plugins > Plugin Management**.
4. In **Upload Plugin**, choose `dist/com.mattermost.ladder-game-0.1.0.tar.gz` and upload.
5. Locate **Ladder Game** under Installed Plugins and click **Enable**.
6. Return to any channel — you'll see the **Ladder (🪜)** button in the channel header!

---

<a name="한국어"></a>
## 한국어

Mattermost 채널 내에서 팀원들과 함께 점심 메뉴 고르기, 커피 쏘기, 순서 정하기 등을 인터랙티브하게 즐길 수 있는 **리치 UI 사다리 타기 플러그인**입니다.

### ✨ 주요 기능

- 🪜 **채널 상단 사다리 아이콘 버튼**: 클릭 한 번으로 간편하게 사다리 게임 팝업 열기
- 👥 **채널 멤버 자동 조회 & 원클릭 추가**: 채널에 있는 참여자들을 자동으로 불러와 클릭하여 참가자로 지정
- ⚡ **원클릭 빠른 프리셋 템플릿**:
  - ☕ **커피 쏘기** (1명 당첨 / 나머지 통과)
  - 🍱 **점심 쏘기** (1명 당첨 / 나머지 통과)
  - 🎉 **당첨 / 꽝** (무작위 섞기)
  - 🥇 **순위 정하기** (1등, 2등, 3등 ...)
- 🎨 **실시간 사다리 타기 인터랙티브 애니메이션**:
  - 참가자 이름을 클릭하면 사다리를 따라 부드럽게 꺾이며 내려가는 애니메이션 재생
  - 참가자별 고유 색상 하이라이트
  - '전체 결과 보기' 원클릭 지원
- 📢 **채널 자동 결과 발표 포스트**:
  - 게임 종료 후 "채널에 공유" 버튼 클릭 시, 채널에 정돈된 Markdown 매칭 결과 테이블 및 봇 메시지 게시
- ⌨️ **슬래시 명령어 지원**:
  - `/ladder` 또는 `/사다리` : 웹앱 모달 즉시 호출
  - `/ladder 점심내기 : 철수, 영희, 민수 : 당첨, 꽝, 커피` : 즉시 생성 후 채널에 바로 결과 게시

### 🛠️ 빌드 방법

#### 사전 요구사항
- Go 1.20 이상
- Node.js 18 이상 및 npm

#### 빌드 및 패키징
```bash
# 전체 빌드 및 .tar.gz 패키지 생성
make dist
```

생성된 파일은 `dist/com.mattermost.ladder-game-0.1.0.tar.gz`에 저장됩니다.

### 🚀 플러그인 설치 방법

1. Mattermost에 **System Admin(시스템 관리자)** 계정으로 로그인합니다.
2. 좌측 상단 메뉴 > **System Console (시스템 콘솔)** 로 이동합니다.
3. **Plugins > Plugin Management (플러그인 관리)** 메뉴를 클릭합니다.
4. **Upload Plugin (플러그인 업로드)** 에서 `dist/com.mattermost.ladder-game-0.1.0.tar.gz` 파일을 선택하여 업로드합니다.
5. 업로드된 **Ladder Game** 플러그인을 찾아 **Enable (활성화)** 를 클릭합니다.
6. 채널로 돌아가면 상단 채널 헤더에 **사다리(🪜)** 아이콘이 나타납니다!
