using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Napkin.Model;
using Napkint.Repos;
using Newtonsoft.Json;

namespace Napkin
{
    public class RawConnection : PersistentConnection
    {
		private static readonly NapkinConnections Members = new NapkinConnections();
		private static readonly NapkinContents Contents = new NapkinContents();

        protected override async Task OnConnected(HttpRequest request, string connectionId)
        {
	        string napkin = request.Query["napkin"];

			Members.AssignToNapkin(connectionId, napkin);

            await Groups.Add(connectionId, napkin);
        }

	    protected override Task OnReconnected(HttpRequest request, string connectionId)
        {
            return null;
        }

        protected override Task OnDisconnected(HttpRequest request, string connectionId, bool stopCalled)
        {
            return null;
        }

        protected override Task OnReceived(HttpRequest request, string connectionId, string data)
        {
            var message = JsonConvert.DeserializeObject<Message>(data);
			

			switch (message.Type)
            {
                case IncomingMessage.Broadcast:
					var item = JsonConvert.DeserializeObject<Item>(message.Json);
					Contents.AddItem(Members.GetNapkin(connectionId), item);

					var broadcastMessage = new
					{
						Type = message.Type.ToString(),
						Json = JsonConvert.SerializeObject(new List<Item>() { item })
					};

					return Groups.Send(Members.GetNapkin(connectionId), broadcastMessage, connectionId);

				case IncomingMessage.RequestContent:
					var requestContents = new
					{
						Type = IncomingMessage.Broadcast.ToString(),
						Json = JsonConvert.SerializeObject(Contents.GetAll(Members.GetNapkin(connectionId)))
					};

					return Connection.Send(connectionId, requestContents);

				default:
                    break;
            }

            return base.OnReceived(request, connectionId, data);
        }

        public enum IncomingMessage
        {
            Broadcast,
			RequestContent
        }

        public class Message
        {
            public IncomingMessage Type { get; set; }
            public string Json { get; set; }
        }
    }
}