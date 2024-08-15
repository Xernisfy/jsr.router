/**
 * @module
 * Simple Router for use with `Deno.serve` using URL-patterns.
 *
 * Add routes using `get`, `patch`, `post`, `put` or `delete` methods or using `route` to handle multiple methods for the same route.
 *
 * @example
 * ```ts
 * import { Router } from "@xernisfy/router";
 *
 * const router = new Router();
 * router.get("/user/:id", ({ query: { id } }) => {
 *   console.log(id);
 *   return new Response(null, { status: 200 });
 * });
 *
 * Deno.serve(router.handler);
 * ```
 */

/** Supported HTTP methods */
enum Method {
  GET = "GET",
  //HEAD = 'HEAD',
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  //CONNECT = 'CONNECT',
  //OPTIONS = 'OPTIONS',
  //TRACE = 'TRACE',
  PATCH = "PATCH",
}

/** Definition of what routes can/must return */
type ResponseLike =
  | Response
  | Promise<Response>
  | ((data: {
    request: Request;
    info: Deno.ServeHandlerInfo;
    query: URLPatternResult["pathname"]["groups"];
  }) => Response | Promise<Response>);

type MethodResponses = Partial<Record<Method, ResponseLike>>;

type Pattern = URLPattern["pathname"];

/** Simple Router for use with `Deno.serve` using URL-patterns.
 *
 * Add routes using `get`, `patch`, `post`, `put` or `delete` methods or using `route` to handle multiple methods for the same route.
 *
 * @example
 * ```ts
 * import { Router } from "@xernisfy/router";
 *
 * const router = new Router();
 * router.get("/user/:id", ({ query: { id } }) => {
 *   console.log(id);
 *   return new Response(null, { status: 200 });
 * });
 *
 * Deno.serve(router.handler);
 * ```
 */
export class Router {
  /** Collection of registered routes */
  private _routes: [URLPattern, MethodResponses][] = [];
  /** Handler method to be used in `Deno.serve`
   *
   * @param {Request} request request object passed by Deno
   * @param {Deno.ServeHandlerInfo} info additional information passed by Deno
   * @returns {Response | Promise<Response>}
   *
   * @example
   * ```ts
   * import { Router } from "@xernisfy/router";
   *
   * const router = new Router();
   * Deno.serve(router.handler);
   * ```
   */
  handler = (
    request: Request,
    info: Deno.ServeHandlerInfo,
  ): Response | Promise<Response> => {
    for (const [pattern, methodResponses] of this._routes) {
      if (!(request.method in methodResponses)) continue;
      if (!pattern.test(request.url)) continue;
      const response = methodResponses[request.method as Method]!;
      if (typeof response === "function") {
        const query = pattern.exec(request.url)!.pathname.groups;
        for (const key in query) {
          if (query[key]) query[key] = decodeURIComponent(query[key]!);
        }
        return response({ request, info, query });
      }
      return response;
    }
    return new Response(null, { status: 404 });
  };
  /** Register a route with multiple possible HTTP methods
   *
   * @example
   * ```ts
   * router.route('/user/:id', {
   *   GET: ({ query: { id } }) => {
   *     return new Response(users[id], { status: 200 });
   *   },
   *   POST: ({ request, query: { id } }) => {
   *     users[id] = await request.json();
   *     return new Response(null, { status: 201 });
   *   }
   * })
   * ```
   */
  route = (pattern: Pattern, methods: MethodResponses): void => {
    this._routes.push([new URLPattern({ pathname: pattern }), methods]);
  };
  /** Register a route for GET
   * @example
   * ```ts
   * router.get('/user/:id', new Response(null, { status: 200 }));
   * ```
   */
  get = (pattern: Pattern, response: ResponseLike): void => {
    this._routes.push([new URLPattern({ pathname: pattern }), {
      GET: response,
    }]);
  };
  /** Register a route for POST
   * @example
   * ```ts
   * router.post('/user/:id', new Response(null, { status: 201 }));
   * ```
   */
  post = (pattern: Pattern, response: ResponseLike): void => {
    this._routes.push([new URLPattern({ pathname: pattern }), {
      POST: response,
    }]);
  };
  /** Register a route for PUT
   * @example
   * ```ts
   * router.put('/user/:id', new Response(null, { status: 200 }));
   * ```
   */
  put = (pattern: Pattern, response: ResponseLike): void => {
    this._routes.push([new URLPattern({ pathname: pattern }), {
      PUT: response,
    }]);
  };
  /** Register a route for DELETE
   * @example
   * ```ts
   * router.delete('/user/:id', new Response(null, { status: 204 }));
   * ```
   */
  delete = (pattern: Pattern, response: ResponseLike): void => {
    this._routes.push([new URLPattern({ pathname: pattern }), {
      DELETE: response,
    }]);
  };
  /** Register a route for PATCH
   * @example
   * ```ts
   * router.patch('/user/:id', new Response(null, { status: 200 }));
   * ```
   */
  patch = (pattern: Pattern, response: ResponseLike): void => {
    this._routes.push([new URLPattern({ pathname: pattern }), {
      PATCH: response,
    }]);
  };
}
