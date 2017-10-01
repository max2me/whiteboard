using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Napkin
{
    public class Startup
    {
        public Startup(IHostingEnvironment env)
        {
            var builder = new ConfigurationBuilder()
                .SetBasePath(env.ContentRootPath)
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true)
                .AddEnvironmentVariables();
            Configuration = builder.Build();
        }

        public IConfigurationRoot Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services
				.AddOptions()
				.AddRouting(options => options.LowercaseUrls = true)
				.AddMvc();

			services.AddSignalR();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseBrowserLink();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
            }

            app
				.UseDefaultFiles()
				.UseStaticFiles()
				.UseWebSockets()
				.UseSignalR(routes =>
	            {
		            routes.MapHub<SyncHub>("r");
	            })
				.UseMvc(routes =>
	            {
		            routes
			            .MapRoute(
				            name: "default",
				            template: "{controller=Home}/{action=Index}/{id?}")
			            .MapRoute(
				            name: "n",
				            template: "{*napkin}/",
				            defaults: new {controller = "Home", action = "Napkin"});
	            })
				.UseStatusCodePages()
				.Run(context =>
				{
					context.Response.StatusCode = 404;
					return Task.FromResult(0);
				});
        }
    }
}
