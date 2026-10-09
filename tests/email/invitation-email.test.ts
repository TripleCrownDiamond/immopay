import {afterEach,describe,expect,it,vi} from "vitest";
import {sendInvitationEmail} from "../../src/lib/email/invitation-email";

const input={id:"invitation-id",to:"awa@example.test",url:"https://immopay.me/invitation/example",organizationName:"Agence Test",kind:"tenant" as const};
const originalKey=process.env.RESEND_API_KEY;
const originalFrom=process.env.INVITATION_FROM_EMAIL;
afterEach(()=>{process.env.RESEND_API_KEY=originalKey;process.env.INVITATION_FROM_EMAIL=originalFrom;});

describe("invitation email",()=>{
  it("keeps a manual-link fallback without sender configuration",async()=>{
    delete process.env.RESEND_API_KEY;delete process.env.INVITATION_FROM_EMAIL;
    const fetcher=vi.fn();
    expect(await sendInvitationEmail(input,fetcher as unknown as typeof fetch)).toBe("not_configured");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("marks only provider acceptance as sent with an idempotency key",async()=>{
    process.env.RESEND_API_KEY="test-key";process.env.INVITATION_FROM_EMAIL="ImmoPay <invites@example.test>";
    const fetcher=vi.fn().mockResolvedValue({ok:true});
    expect(await sendInvitationEmail(input,fetcher as unknown as typeof fetch)).toBe("sent");
    expect(fetcher).toHaveBeenCalledWith("https://api.resend.com/emails",expect.objectContaining({method:"POST"}));
    const options=fetcher.mock.calls[0][1] as RequestInit;
    expect((options.headers as Record<string,string>)["Idempotency-Key"]).toBe("invitation/invitation-id");
    expect(JSON.parse(String(options.body))).toMatchObject({to:input.to});
    expect(String(options.body)).toContain(input.url);
  });
  it("reports provider rejection and network failure without throwing",async()=>{
    process.env.RESEND_API_KEY="test-key";process.env.INVITATION_FROM_EMAIL="invites@example.test";
    expect(await sendInvitationEmail(input,vi.fn().mockResolvedValue({ok:false}) as unknown as typeof fetch)).toBe("failed");
    expect(await sendInvitationEmail(input,vi.fn().mockRejectedValue(new Error("offline")) as unknown as typeof fetch)).toBe("failed");
  });
});
