import {describe, expect, it, vi} from "vitest";

const {requestPasswordReset}=vi.hoisted(()=>({requestPasswordReset:vi.fn()}));
vi.mock("../../src/lib/auth/client",()=>({authClient:{requestPasswordReset}}));
import {requestResetPublicMessage, RESET_NOTICE} from "../../src/lib/auth/password-recovery";

describe("password reset request",()=>{
  it("does not reveal whether the email exists",async()=>{
    requestPasswordReset.mockResolvedValueOnce({data:{status:true},error:null});
    requestPasswordReset.mockResolvedValueOnce({data:null,error:{status:404}});
    expect(await requestResetPublicMessage(" Known@Example.test ","https://immopay.me")).toBe(RESET_NOTICE);
    expect(await requestResetPublicMessage("unknown@example.test","https://immopay.me")).toBe(RESET_NOTICE);
    expect(requestPasswordReset).toHaveBeenCalledWith({email:"known@example.test",redirectTo:"https://immopay.me/reinitialiser-mot-de-passe"});
  });
  it("shows a temporary failure when Neon is unavailable",async()=>{
    requestPasswordReset.mockResolvedValueOnce({data:null,error:{status:503}});
    await expect(requestResetPublicMessage("x@example.test","https://immopay.me")).rejects.toThrow("AUTH_UNAVAILABLE");
  });
});
