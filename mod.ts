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

export class Router {
  private _routes: [URLPattern, MethodResponses][] = [];
  private _defaultResponse = new Response(null, { status: 404 });
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
    return this._defaultResponse;
  };
  route = (pattern: Pattern, methods: MethodResponses): void => {
    this._routes.push([new URLPattern({ pathname: pattern }), methods]);
  };
  get = (pattern: Pattern, response: ResponseLike): void => {
    this._routes.push([new URLPattern({ pathname: pattern }), {
      GET: response,
    }]);
  };
  post = (pattern: Pattern, response: ResponseLike): void => {
    this._routes.push([new URLPattern({ pathname: pattern }), {
      POST: response,
    }]);
  };
  put = (pattern: Pattern, response: ResponseLike): void => {
    this._routes.push([new URLPattern({ pathname: pattern }), {
      PUT: response,
    }]);
  };
  delete = (pattern: Pattern, response: ResponseLike): void => {
    this._routes.push([new URLPattern({ pathname: pattern }), {
      DELETE: response,
    }]);
  };
  patch = (pattern: Pattern, response: ResponseLike): void => {
    this._routes.push([new URLPattern({ pathname: pattern }), {
      PATCH: response,
    }]);
  };
}
