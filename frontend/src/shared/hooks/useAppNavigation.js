import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { parseAppPath, pathForView, resolveViewFromPath } from '@/app/paths';

/**
 * URL-driven navigation — reload keeps you on the same page.
 */
export function useAppNavigation(ctx = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const parsed = useMemo(
    () => parseAppPath(location.pathname),
    [location.pathname]
  );

  const activeView = resolveViewFromPath(location.pathname);
  const contentSourceFromUrl = searchParams.has('source')
    ? (searchParams.get('source') === 'mine' ? 'mine' : 'global')
    : null;

  const goToView = useCallback(
    (view, options = {}) => {
      const merged = {
        source: options.source ?? ctx.source,
        subject: options.subject ?? ctx.subject,
        topicId: options.topicId ?? ctx.topicId,
        mockId: options.mockId ?? ctx.mockId,
      };
      const path = pathForView(view, merged);
      if (path !== location.pathname + location.search) {
        navigate(path);
      }
    },
    [navigate, location.pathname, location.search, ctx.source, ctx.subject, ctx.topicId, ctx.mockId]
  );

  const goToPath = useCallback(
    (path) => {
      if (path && path !== location.pathname + location.search) {
        navigate(path);
      }
    },
    [navigate, location.pathname, location.search]
  );

  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return {
    location,
    navigate,
    searchParams,
    parsed,
    activeView,
    contentSourceFromUrl,
    goToView,
    goToPath,
    goBack,
  };
}
