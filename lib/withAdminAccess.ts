import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { parse } from 'cookie';

export function withAdminAccess(gssp?: GetServerSideProps): GetServerSideProps {
  return async (ctx: GetServerSidePropsContext) => {
    const cookies = ctx.req.headers.cookie ? parse(ctx.req.headers.cookie) : {};
    const userEmail = cookies['userEmail'];

    if (userEmail !== 'kcc-kem@ya.ru') {
      return {
        redirect: {
          destination: '/auth/login',
          permanent: false,
        },
      };
    }

    if (gssp) {
      return await gssp(ctx);
    }

    return { props: {} };
  };
}
