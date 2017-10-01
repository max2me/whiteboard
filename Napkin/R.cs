using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Napkin.Model;
using Napkin.Repos;
using Newtonsoft.Json;

namespace Napkin
{
    public class R : Hub
    {
		private static readonly NapkinConnections Members = new NapkinConnections();
		private static readonly NapkinContents Contents = new NapkinContents();

	    public async Task<IEnumerable<Item>> JoinNapkin(string napkinId)
	    {
		    Members.AssignToNapkin(Context.ConnectionId, napkinId);

		    await Groups.AddAsync(Context.ConnectionId, napkinId);

		    return Contents.GetAll(napkinId);
	    }

	    public async Task Broadcast(Item item)
	    {
		    var napkinId = Members.GetNapkin(Context.ConnectionId);
		    Contents.AddItem(napkinId, item);

			await Clients.Group(napkinId).InvokeAsync("Broadcast", item);
		}

		/*
		protected override Task OnReceived(HttpRequest request, string connectionId, string data)
        {
            var message = JsonConvert.DeserializeObject<Message>(data);
			

			switch (message.Type)
            {
                case IncomingMessage.Broadcast:
					
					

					

				case IncomingMessage.RequestContent:
					var requestContents = new
					{
						Type = IncomingMessage.Broadcast.ToString(),
						Json = JsonConvert.SerializeObject()
					};

					return Connection.Send(connectionId, requestContents);

				case IncomingMessage.ClearAll:
					Contents.ClearAll(Members.GetNapkin(connectionId));

					var clearAllContents = new
					{
						Type = IncomingMessage.ClearAll.ToString()
					};

					return Groups.Send(Members.GetNapkin(connectionId), clearAllContents, connectionId);

				default:
                    break;
            }

            return base.OnReceived(request, connectionId, data);
        }
		*/

        public enum IncomingMessage
        {
            Broadcast,
			RequestContent,
			ClearAll
        }

        public class Message
        {
            public IncomingMessage Type { get; set; }
            public string Json { get; set; }
        }
    }
}