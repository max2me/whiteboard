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

            await Groups.Add(connectionId, "foo");
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

            string suffix = stopCalled ? "cleanly" : "uncleanly";
            return null;
        }

        protected override Task OnReceived(HttpRequest request, string connectionId, string data)
        {
            var message = JsonConvert.DeserializeObject<Message>(data);

            switch (message.Type)
            {
                case IncomingMessage.Broadcast:
				case IncomingMessage.Delete:
                    return Connection.Broadcast(new
                    {
                        Type = message.Type.ToString(),
                        Json = message.Json
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

        private string GetClient(string user)
        {
            string connectionId;
            if (Users.TryGetValue(user, out connectionId))
            {
                return connectionId;
            }
            return null;
        }

        public enum IncomingMessage
        {
            Broadcast,
			Delete
        }

        class Message
        {
            public IncomingMessage Type { get; set; }
            public string Json { get; set; }
        }
    }
}