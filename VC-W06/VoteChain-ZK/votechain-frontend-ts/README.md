# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```




# Final design
```javascript
    FRONTEND
    │
    ├── RegisterCandidate.tsx  → POST /api/candidates/register → candidateRoutes.js → Candidate.js (MongoDB)
    │                             (Also later: push to blockchain)
    │
    ├── RegisterVoter.tsx      → POST /api/voter              → voterController.js → Voter.js (MongoDB)
    │                             (Also later: push to blockchain)
    │
    ├── VotePage.tsx or VoterDashboard.tsx → POST /api/vote/cast → voteController.js → (castVote → blockchain.vote(NID))
    │
    ├── ElectionStatus.tsx / PublicDashboard.tsx → GET /public/election-data → electionController.js → blockchain.getCandidates()
    │
    BACKEND
    │
    ├── models/
    │   ├── Candidate.js   → Candidate schema (MongoDB)
    │   └── Voter.js       → Voter schema (MongoDB)
    │
    ├── routes/
    │   └── candidateRoutes.js → register candidate, fetch candidates
    │
    ├── controllers/
    │   ├── voterController.js     → register voter, CRUD voters
    │   ├── voteController.js      → verifyFace, verifyFingerprint, castVote (to blockchain)
    │   └── electionController.js  → read election data (from blockchain)
    │
    └── utils/
        └── contract.js → connects to blockchain contract

```