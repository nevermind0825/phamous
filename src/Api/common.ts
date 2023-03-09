import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

function createClient(uri: string, appId?: string) {
  const httpLink = createHttpLink({
    uri: uri,
  });

  const authLink = setContext((_, { headers }) => {
    return {
      headers: {
        ...headers,
        'X-Parse-Application-Id': 'Ot3wHoK1yU2I0L5Ef6I4jL2eM16bbSqzq7LbJWNr',
      },
    };
  });

  return new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
  });
}

export const phamousGraphClient = createClient('https://phiat.exchange/graphql/');
