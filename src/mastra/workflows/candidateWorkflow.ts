import { Mastra } from '@mastra/core';
import { recruiterAgent } from "../agents";
import { Step, Workflow } from '@mastra/core/workflows';
import { z } from 'zod';

const gatherCandidateInfo = new Step({
  id: 'gatherCandidateInfo',
  inputSchema: z.object({
    resumeText: z.string(),
  }),
  outputSchema: z.object({
    candidateName: z.string(),
    isTechnical: z.boolean(),
    specialty: z.string(),
    resumeText: z.string(),
  }),
  execute: async ({ context, mastra }) => {
    const resumeText = context?.getStepResult<{ resumeText: string }>('trigger')?.resumeText;

    const prompt = `
          以下の履歴書を分析してください：
          "${resumeText}"
        `;
    const res = await recruiterAgent.generate(prompt, {
      output: z.object({
        candidateName: z.string(),
        isTechnical: z.boolean(),
        specialty: z.string(),
        resumeText: z.string(),
      }),
    });

    return res.object;
  },
});

interface CandidateInfo {
  candidateName: string;
  isTechnical: boolean;
  specialty: string;
  resumeText: string;
}

const askAboutSpecialty = new Step({
  id: 'askAboutSpecialty',
  outputSchema: z.object({
    question: z.string(),
  }),
  execute: async ({ context, mastra }) => {
    const candidateInfo = context?.getStepResult<CandidateInfo>('gatherCandidateInfo');

    const prompt = `
          あなたは採用担当者です。以下の履歴書に基づいて、
          ${candidateInfo?.candidateName}さんが"${candidateInfo?.specialty}"の分野に
          どのように興味を持ったのかについて、簡単な質問を作成してください。
          履歴書: ${candidateInfo?.resumeText}
        `;
    const res = await recruiterAgent.generate(prompt);
    return { question: res?.text?.trim() || '' };
  },
});

const askAboutRole = new Step({
  id: 'askAboutRole',
  outputSchema: z.object({
    question: z.string(),
  }),
  execute: async ({ context, mastra }) => {
    const candidateInfo = context?.getStepResult<CandidateInfo>('gatherCandidateInfo');

    const prompt = `
          あなたは採用担当者です。以下の履歴書に基づいて、
          ${candidateInfo?.candidateName}さんにこの職位の何に最も興味があるかについて、
          簡単な質問を作成してください。
          履歴書: ${candidateInfo?.resumeText}
        `;
    const res = await recruiterAgent.generate(prompt);
    return { question: res?.text?.trim() || '' };
  },
});

export const candidateWorkflow = new Workflow({
  name: 'candidate-workflow',
  triggerSchema: z.object({
    resumeText: z.string(),
  }),
});
true
candidateWorkflow
  .step(gatherCandidateInfo)
  .if(async ({ context }) => {
    const value = context.getStepResult<{ isTechnical: boolean }>('gatherCandidateInfo')?.isTechnical ?? 0;
    return value == true;
  })
  .then(askAboutSpecialty)
  .else()
  .then(askAboutRole);

//   .then(askAboutSpecialty, {
//     when: { "gatherCandidateInfo.isTechnical": true },
//   })
//   .after(gatherCandidateInfo)
//   .step(askAboutRole, {
//     when: { "gatherCandidateInfo.isTechnical": false },
//   })

candidateWorkflow.commit();

// 技術岗
const technicalResume = `
職務経歴書

氏名：山田太郎
専門：ソフトウェアエンジニアリング

職務要約：
- 8年間のソフトウェア開発経験
- フルスタック開発者として5年の実務経験
- TypeScript、React、Node.jsの専門知識
- マイクロサービスアーキテクチャの設計と実装経験

技術スキル：
- フロントエンド：React、Vue.js、TypeScript
- バックエンド：Node.js、Express、NestJS
- データベース：PostgreSQL、MongoDB
- クラウド：AWS、Docker、Kubernetes

職務経歴：
株式会社テックソリューションズ（2019-現在）
- マイクロサービスアーキテクチャの設計と実装
- チームリーダーとして10人規模のチームをマネジメント
- パフォーマンス最適化によりレスポンス時間を50%改善
`;

// 非技術岗
const nonTechnicalResume = `
職務経歴書

氏名：鈴木花子
専門：マーケティング

職務要約：
- 6年間のデジタルマーケティング経験
- ブランド戦略立案と実行
- SNSマーケティングの専門知識
- チーム管理とプロジェクトマネジメント経験

主なスキル：
- デジタルマーケティング戦略立案
- コンテンツマーケティング
- SNS運用・分析
- チームマネジメント

職務経歴：
グローバルマーケティング株式会社（2018-現在）
- マーケティング戦略の立案と実行
- 新規顧客獲得数を前年比150%に向上
- コンテンツマーケティングチームのリーダー
- 顧客エンゲージメント率を30%改善
`;

// const mastra = new Mastra({
//   workflows: {
//     candidateWorkflow,
//   },
// });

// (async () => {
//   const { runId, start } = mastra.getWorkflow('candidateWorkflow').createRun();

//   console.log('実行ID:', runId);

//   const runResult = await start({
//     triggerData: { resumeText: 'シミュレートされた履歴書の内容...' },
//   });

//   console.log('最終出力:', runResult.results);
// })();