# study

스터디에서 배운 내용을 정리해서 올리는 곳. 글은 마크다운으로 쓰고, GitHub Pages에서 GitHub 스타일 그대로 렌더링한다. PDF로 내보내거나 따로 빌드하는 단계는 없다.

네트워크 스터디용으로 만들었지만 스터디 종류와 무관하게 쓸 수 있다. `public/` 아래에 스터디별 폴더가 있고, 그 안에 글 하나당 폴더 하나가 들어간다.

## 구조

```
public/
  index.html        # 목록 페이지 (manifest.json 읽어서 렌더)
  viewer.html       # 글 하나를 zero-md로 렌더 (viewer.html#<study>/<slug>/index.md)
  manifest.json     # 스터디/글 목록
  <study-id>/<slug>/index.md   # 글. 첫 H1이 제목. frontmatter 없음
  <study-id>/<slug>/images/    # 그 글의 이미지 (상대경로로 참조)
```

## 글 쓰는 법

Claude Code 스킬로 돌린다.

```
/new-study AI 네트워킹 스터디        # 스터디 새로 만들기
/new-article ai-networking 1주차 정리  # 글 초안 쓰기
/revise ai-networking/week1-...       # 글 다듬기, AI 티 빼기
/preview                              # 로컬에서 미리보기
/publish                              # 커밋하고 푸시해서 배포
```

스킬을 안 쓰고 직접 써도 된다. `public/_template/index.md`를 복사해서 `public/<study>/<slug>/index.md`로 두고, `manifest.json`에 항목을 추가하면 목록에 뜬다.

글이 AI가 쓴 것처럼 읽히지 않게 하는 게 핵심이라 `.claude/rules/`에 한국어/영어 문체 규칙을 넣어놨다.

## 로컬 미리보기

마크다운을 브라우저에서 렌더링하기 때문에 `file://`로는 안 열린다. HTTP로 서빙해야 한다.

```bash
cd public && python3 -m http.server 8000
# http://localhost:8000/
```

## 배포

`main`에 푸시하면 `.github/workflows/deploy-pages.yml`이 `public/`을 GitHub Pages로 올린다. 처음 한 번은 저장소 Settings -> Pages에서 Source를 "GitHub Actions"로 바꿔줘야 한다.

사이트: <https://hhoikoo.github.io/study/>
