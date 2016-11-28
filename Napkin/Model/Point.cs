using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace Napkin.Model
{
    public class Point
    {
		[JsonProperty("x")]
		public decimal X { get; set; }

		[JsonProperty("y")]
		public decimal Y { get; set; }
    }
}
