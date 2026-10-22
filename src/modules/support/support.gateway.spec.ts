import { WsException } from '@nestjs/websockets';
import { SupportGateway } from './support.gateway';
import { SupportService } from './support.service';

describe('SupportGateway authorization and persistence', () => {
  const getTicket = jest.fn();
  const addTicketMessage = jest.fn();
  const supportService = {
    getTicket,
    addTicketMessage,
  } as unknown as SupportService;
  const gateway = new SupportGateway(supportService);

  beforeEach(() => {
    jest.resetAllMocks();
    (gateway as unknown as { server: unknown }).server = {
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    };
  });

  it('does not join a ticket that is missing or belongs to another companion', async () => {
    getTicket.mockRejectedValue(new Error('not found'));
    const join = jest.fn();
    await expect(
      gateway.handleJoinTicket(
        { data: { companion: { sub: 'companion-a', phone: '+10000000000', accountStatus: 'active' } } } as never,
        { ticketId: 'ticket-b' },
      ),
    ).rejects.toBeInstanceOf(WsException);
    expect(getTicket).toHaveBeenCalledWith('companion-a', 'ticket-b');
    expect(join).not.toHaveBeenCalled();
  });

  it('requires a joined room before allowing a persisted message', async () => {
    const client = {
      data: { companion: { sub: 'companion-a', phone: '+10000000000', accountStatus: 'active' } },
      rooms: new Set(['socket-a']),
      to: jest.fn(),
    };
    await expect(
      gateway.handleMessage(client as never, {
        ticketId: 'ticket-a',
        text: 'hello',
      }),
    ).rejects.toBeInstanceOf(WsException);
    expect(addTicketMessage).not.toHaveBeenCalled();
  });

  it('stores the authorized message before broadcasting it', async () => {
    const storedMessage = {
      id: 'message-1',
      senderId: 'companion-a',
      senderType: 'companion',
      text: 'hello',
      timestamp: new Date().toISOString(),
    };
    addTicketMessage.mockResolvedValue({
      message: 'Reply sent',
      data: storedMessage,
    });
    const client = {
      data: { companion: { sub: 'companion-a', phone: '+10000000000', accountStatus: 'active' } },
      rooms: new Set(['socket-a', 'ticket_ticket-a']),
    };
    const result = await gateway.handleMessage(client as never, {
      ticketId: 'ticket-a',
      text: ' hello ',
    });
    expect(addTicketMessage).toHaveBeenCalledWith(
      'companion-a',
      'ticket-a',
      'hello',
    );
    expect(result).toEqual({ success: true, message: storedMessage });
    const server = gateway.server as unknown as { to: jest.Mock };
    expect(server.to).toHaveBeenCalledWith('ticket_ticket-a');
    expect(server.to.mock.results[0].value.emit).toHaveBeenCalledWith(
      'receive_support_message',
      storedMessage,
    );
  });

  it('rejects unconfigured attachment URL payloads instead of broadcasting unpersisted data', async () => {
    const client = {
      data: { companion: { sub: 'companion-a', phone: '+10000000000', accountStatus: 'active' } },
      rooms: new Set(['socket-a', 'ticket_ticket-a']),
    };
    await expect(
      gateway.handleMessage(client as never, {
        ticketId: 'ticket-a',
        text: 'file',
        attachmentUrl: 'https://example.invalid/file',
      }),
    ).rejects.toBeInstanceOf(WsException);
    expect(addTicketMessage).not.toHaveBeenCalled();
  });
});
