import { useEffect } from 'react';
import { usePrevious } from '../utils/Helpers';

const useEffectDebugger = (effectHook: () => void, dependencies: any, dependencyNames = []) => {
  const previousDeps = usePrevious(dependencies);

  const changedDeps = dependencies.reduce((accum: any, dependency: any, index: number) => {
    if (dependency !== previousDeps[index]) {
      const keyName = dependencyNames[index] || index;
      return {
        ...accum,
        [keyName]: {
          before: previousDeps[index],
          after: dependency,
        },
      };
    }

    return accum;
  }, {});

  if (Object.keys(changedDeps).length) {
    console.log('[use-effect-debugger] ', changedDeps);
  }

  useEffect(effectHook, [...dependencies, effectHook]);
};

export default useEffectDebugger;
