import {Config} from '@remotion/cli/config';
Config.overrideWebpackConfig((config) => {
  const fix = (rule: any): any => {
    if (!rule || typeof rule !== 'object') return rule;
    if (Array.isArray(rule.use)) {
      rule.use = rule.use.map((u: any) =>
        u && typeof u === 'object' && typeof u.loader === 'string' && u.loader.includes('esbuild-loader')
          ? {...u, options: {...u.options, tsconfigRaw: {compilerOptions: {jsx: 'react-jsx'}}}}
          : u,
      );
    }
    if (Array.isArray(rule.oneOf)) rule.oneOf = rule.oneOf.map(fix);
    return rule;
  };
  return {...config, module: {...config.module, rules: (config.module?.rules ?? []).map(fix)}};
});
