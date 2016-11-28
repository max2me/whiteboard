using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Newtonsoft.Json;
using wsweb.Model;

namespace wsweb
{
    public class RawConnection : PersistentConnection
    {
        private static readonly ConcurrentDictionary<string, string> Clients = new ConcurrentDictionary<string, string>();
        private static readonly ConcurrentDictionary<string, string> ConnectionGroups = new ConcurrentDictionary<string, string>();
	    private static readonly string QueryStringParameterName = "napkin";

        protected override async Task OnConnected(HttpRequest request, string connectionId)
        {
            var userName = request.Cookies["user"];
            if (!string.IsNullOrEmpty(userName))
            {
                Clients[connectionId] = userName;
            }

            string clientIp = request.HttpContext.Connection.RemoteIpAddress?.ToString();
            string user = GetUser(connectionId);
	        string napkin = request.Query[QueryStringParameterName];

	        AssignConnectionToNapkin(connectionId, napkin);

            await Groups.Add(connectionId, napkin);
        }

	    private void AssignConnectionToNapkin(string connectionId, string napkin)
	    {
		    ConnectionGroups[connectionId] = napkin;
	    }

	    private string GetNapkin(string connectionId)
	    {
		    return ConnectionGroups[connectionId];
	    }

	    protected override Task OnReconnected(HttpRequest request, string connectionId)
        {
            string user = GetUser(connectionId);

            return null;
        }

        protected override Task OnDisconnected(HttpRequest request, string connectionId, bool stopCalled)
        {
            string ignored;
            // Users.TryRemove(connectionId, out ignored);

            return null;
        }

        protected override Task OnReceived(HttpRequest request, string connectionId, string data)
        {
            var message = JsonConvert.DeserializeObject<Message>(data);
			var item = JsonConvert.DeserializeObject<Item>(message.Json);
	        var broadcastMessage = new {
		        Type = message.Type.ToString(),
		        Json = JsonConvert.SerializeObject(new List<Item>() {item})
	        };

			switch (message.Type)
            {
                case IncomingMessage.Broadcast:
                    return Groups.Send(GetNapkin(connectionId), broadcastMessage, connectionId);
                default:
                    break;
            }

            return base.OnReceived(request, connectionId, data);
        }

        private string GetUser(string connectionId)
        {
            string user;
            if (!Clients.TryGetValue(connectionId, out user))
            {
                return connectionId;
            }
            return user;
        }

        public enum IncomingMessage
        {
            Broadcast
        }

        public class Message
        {
            public IncomingMessage Type { get; set; }
            public string Json { get; set; }
        }
    }
}