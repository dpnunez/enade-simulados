import { describe, expect, it } from "vitest";
import { z } from "zod";

import { adminUsersQuerySchema } from "./admin-user.schema";

describe("admin-user.schema", () => {
  it("aplica defaults para paginacao e ordenacao", () => {
    expect(adminUsersQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: 20,
      sort: "createdAt",
      direction: "desc",
    });
  });

  it("coage parametros validos de query string", () => {
    expect(
      adminUsersQuerySchema.parse({
        page: "2",
        pageSize: "50",
        sort: "email",
        direction: "asc",
      }),
    ).toEqual({
      page: 2,
      pageSize: 50,
      sort: "email",
      direction: "asc",
    });
  });

  it("rejeita pagina invalida", () => {
    expect(() => adminUsersQuerySchema.parse({ page: "0" })).toThrow(
      z.ZodError,
    );
  });

  it("rejeita pageSize fora do limite operacional", () => {
    expect(() => adminUsersQuerySchema.parse({ pageSize: "101" })).toThrow(
      z.ZodError,
    );
  });

  it("restringe campos de ordenacao permitidos", () => {
    expect(() => adminUsersQuerySchema.parse({ sort: "updatedAt" })).toThrow(
      z.ZodError,
    );
  });

  it("restringe direcao de ordenacao", () => {
    expect(() =>
      adminUsersQuerySchema.parse({ direction: "sideways" }),
    ).toThrow(z.ZodError);
  });
});
