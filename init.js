const fs = require('fs');
const path = require('path');

const dirs = [
  'apps/web/app',
  'apps/web/components',
  'apps/web/public',
  'apps/web/styles',
  'apps/api/src',
  'apps/ml-engine/app',
  'packages/ui/src',
  'packages/database/prisma',
  'packages/config-typescript',
  'packages/config-eslint',
];

dirs.forEach(dir => fs.mkdirSync(path.join(process.cwd(), dir), { recursive: true }));

const files = {
  'pnpm-workspace.yaml': `packages:
  - 'apps/*'
  - 'packages/*'
`,
  'turbo.json': `{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "lint": {},
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
`,
  'package.json': `{
  "name": "fintech-fraudies-monorepo",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "latest",
    "typescript": "^5.0.0"
  },
  "engines": {
    "node": ">=18"
  },
  "packageManager": "pnpm@8.15.0"
}
`,
  'apps/web/package.json': `{
  "name": "web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.16",
    "react": "^18",
    "react-dom": "^18",
    "gsap": "^3.12.5",
    "lucide-react": "^0.454.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5"
  }
}
`,
  'apps/api/package.json': `{
  "name": "api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "nest start"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@prisma/client": "^5.10.0",
    "bcrypt": "^5.1.1",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@types/bcrypt": "^5.0.2",
    "@types/node": "^20",
    "@types/passport-jwt": "^4.0.0",
    "typescript": "^5"
  }
}
`,
  'apps/api/tsconfig.json': `{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": false,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
`,
  'apps/ml-engine/requirements.txt': `fastapi==0.104.1
uvicorn==0.24.0
scikit-learn==1.3.2
pandas==2.1.3
numpy==1.26.2
`,
  'packages/database/package.json': `{
  "name": "database",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@prisma/client": "^5.10.0"
  },
  "devDependencies": {
    "prisma": "^5.10.0"
  }
}
`,
  'packages/ui/package.json': `{
  "name": "ui",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.tsx",
  "types": "./src/index.tsx",
  "dependencies": {
    "react": "^18",
    "lucide-react": "^0.454.0"
  },
  "devDependencies": {
    "@types/react": "^18",
    "typescript": "^5"
  }
}
`
};

for (const [filepath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(process.cwd(), filepath), content);
}
console.log('Scaffold complete');


// ============================================================
// apps/web
// ============================================================