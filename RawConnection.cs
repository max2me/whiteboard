using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Newtonsoft.Json;

namespace wsweb
{
    public class RawConnection : PersistentConnection
    {
        private static readonly ConcurrentDictionary<string, string> Users = new ConcurrentDictionary<string, string>();
        private static readonly ConcurrentDictionary<string, string> Clients = new ConcurrentDictionary<string, string>();
	    private static readonly string QueryStringParameterName = "napkin";

        protected override async Task OnConnected(HttpRequest request, string connectionId)
        {
            var userName = request.Cookies["user"];
            if (!string.IsNullOrEmpty(userName))
            {
                Clients[connectionId] = userName;
                Users[userName] = connectionId;
            }

            string clientIp = request.HttpContext.Connection.RemoteIpAddress?.ToString();
            string user = GetUser(connectionId);
	        string napkin = request.Query[QueryStringParameterName];

            await Groups.Add(connectionId, napkin);
        }

        protected override Task OnReconnected(HttpRequest request, string connectionId)
        {
            string user = GetUser(connectionId);

            return null;
        }

        protected override Task OnDisconnected(HttpRequest request, string connectionId, bool stopCalled)
        {
            string ignored;
            Users.TryRemove(connectionId, out ignored);

            return null;
        }

        protected override Task OnReceived(HttpRequest request, string connectionId, string data)
        {
            var message = JsonConvert.DeserializeObject<Message>(data);

            switch (message.Type)
            {
                case IncomingMessage.Broadcast:
                    return Connection.Broadcast(new
                    {
                        Type = message.Type.ToString(),
                        Json = "[" + message.Json + "]"
                    },
                    connectionId);
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