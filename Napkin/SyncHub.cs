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
    public class SyncHub : Hub
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

	    public async Task ClearAll()
	    {
		    var napkinId = Members.GetNapkin(Context.ConnectionId);
			Contents.ClearAll(napkinId);

		    await Clients.Group(napkinId).InvokeAsync("ClearAll");
		}
		
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